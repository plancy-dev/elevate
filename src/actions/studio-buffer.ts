"use server";

import { revalidatePath } from "next/cache";
import { createHash } from "node:crypto";
import { getOrgMemberContext } from "@/lib/auth/require-org-editor";
import { ActionErrorCode } from "@/lib/i18n/action-error-codes";
import { createClient } from "@/lib/supabase/server";
import { getStudioEpisodeForOrg } from "@/lib/data/studio-productions";
import { readStudioIntegrationsServerEnabled } from "@/lib/studio-integrations/feature";
import { isStudioIntegrationsEncryptionConfigured } from "@/lib/studio-integrations/crypto";
import { resolveBufferApiKey } from "@/lib/studio-integrations/buffer-key-source";
import {
  createBufferPost,
  listBufferChannels,
  type BufferChannel,
  type BufferError,
} from "@/lib/studio-integrations/providers/buffer";
import { parseSocialCaptions, renderPlatformCaption } from "@/lib/studio-productions/social-captions";
import { logAudit } from "@/lib/audit/log";
import { AuditAction, AuditEntityType } from "@/lib/audit/constants";
import type { Database } from "@/types/database.types";

function mapBufferErrorCode(err: BufferError): string {
  switch (err.code) {
    case "buffer_missing_key":
      return ActionErrorCode.studioBufferNoKey;
    case "buffer_auth_error":
      return ActionErrorCode.studioBufferAuthError;
    case "buffer_rate_limited":
      return ActionErrorCode.studioBufferRateLimited;
    case "buffer_timeout":
      return ActionErrorCode.studioBufferTimeout;
    case "buffer_validation":
      return ActionErrorCode.studioBufferValidation;
    default:
      return ActionErrorCode.studioBufferApiError;
  }
}

export type ListBufferChannelsResult =
  | { ok: true; channels: BufferChannel[] }
  | { ok: false; error: string };

/**
 * List Buffer channels for the authenticated org API token. Used by the
 * Integrations UI (to show the user what Buffer sees) and the
 * PublishScheduler (channel toggles).
 */
export async function listBufferChannelsForOrg(): Promise<ListBufferChannelsResult> {
  if (!readStudioIntegrationsServerEnabled()) {
    return { ok: false, error: ActionErrorCode.studioIntegrationsDisabled };
  }
  if (!isStudioIntegrationsEncryptionConfigured()) {
    return {
      ok: false,
      error: ActionErrorCode.studioIntegrationsEncryptionNotConfigured,
    };
  }
  const supabase = await createClient();
  const auth = await getOrgMemberContext(supabase);
  if (!auth.ok) return { ok: false, error: auth.error };

  const apiKey = await resolveBufferApiKey(supabase, auth.ctx.organizationId);
  if (!apiKey) return { ok: false, error: ActionErrorCode.studioBufferNoKey };

  const result = await listBufferChannels(apiKey);
  if (!result.ok) {
    return { ok: false, error: mapBufferErrorCode(result.error) };
  }
  return { ok: true, channels: result.channels };
}

export type SchedulePostState = {
  ok?: boolean;
  error?: string;
  /** Scheduled post row ids created (one per channel). */
  scheduledIds?: string[];
  /** Per-channel failures — surfaced inline so the user can retry individually. */
  failures?: Array<{ channelId: string; error: string }>;
} | null;

function makeIdempotencyKey(parts: {
  organizationId: string;
  episodeId: string;
  channelId: string;
  scheduledAt: string;
}): string {
  const raw = [
    parts.organizationId,
    parts.episodeId,
    parts.channelId,
    parts.scheduledAt,
  ].join("|");
  return createHash("sha1").update(raw).digest("hex").slice(0, 32);
}

type EpisodeAssembledVideoLookup = {
  videoUrl: string | null;
};

async function getAssembledVideoUrl(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  episodeId: string,
): Promise<EpisodeAssembledVideoLookup> {
  const { data } = await supabase
    .from("studio_production_artifacts")
    .select("external_url, created_at")
    .eq("episode_id", episodeId)
    .eq("organization_id", organizationId)
    .eq("artifact_role", "assembled_video")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return { videoUrl: data?.external_url ?? null };
}

async function getLatestCaptionsArtifact(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  episodeId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("studio_production_artifacts")
    .select("content_text")
    .eq("episode_id", episodeId)
    .eq("organization_id", organizationId)
    .eq("artifact_role", "social_captions")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.content_text ?? null;
}

/**
 * Create one scheduled Buffer post per selected channel. Rows are inserted
 * first (status='pending'), then the Buffer API is called in parallel, and
 * finally each row is updated to 'scheduled' or 'failed'. If Buffer rejects
 * a channel, the row stays in `failed` with `last_error` so the UI can
 * retry without re-running the full flow.
 */
export async function schedulePostToBuffer(
  _prev: SchedulePostState,
  formData: FormData,
): Promise<SchedulePostState> {
  void _prev;
  if (!readStudioIntegrationsServerEnabled()) {
    return { error: ActionErrorCode.studioIntegrationsDisabled };
  }
  if (!isStudioIntegrationsEncryptionConfigured()) {
    return { error: ActionErrorCode.studioIntegrationsEncryptionNotConfigured };
  }

  const supabase = await createClient();
  const auth = await getOrgMemberContext(supabase);
  if (!auth.ok) return { error: auth.error };

  const episodeId = String(formData.get("episode_id") ?? "").trim();
  const scheduledAt = String(formData.get("scheduled_at") ?? "").trim();
  if (!episodeId || !scheduledAt) return { error: ActionErrorCode.unexpected };

  const scheduledDate = new Date(scheduledAt);
  if (!Number.isFinite(scheduledDate.getTime())) {
    return { error: ActionErrorCode.unexpected };
  }
  if (scheduledDate.getTime() <= Date.now()) {
    return { error: ActionErrorCode.studioSchedulerPastTime };
  }

  const rawChannels = formData.getAll("channel[]");
  type ChannelRequest = { channelId: string; platform: string; caption: string };
  const channelRequests: ChannelRequest[] = [];
  for (const entry of rawChannels) {
    const asString = String(entry);
    try {
      const parsed = JSON.parse(asString) as ChannelRequest;
      if (parsed.channelId && parsed.platform) {
        channelRequests.push({
          channelId: String(parsed.channelId),
          platform: String(parsed.platform),
          caption: String(parsed.caption ?? ""),
        });
      }
    } catch {
      /* ignore malformed rows */
    }
  }
  if (channelRequests.length === 0) {
    return { error: ActionErrorCode.studioSchedulerNoChannels };
  }

  const episode = await getStudioEpisodeForOrg(
    supabase,
    episodeId,
    auth.ctx.organizationId,
  );
  if (!episode) return { error: ActionErrorCode.studioEpisodeNotFound };

  const { videoUrl } = await getAssembledVideoUrl(
    supabase,
    auth.ctx.organizationId,
    episodeId,
  );
  if (!videoUrl) return { error: ActionErrorCode.studioSchedulerNoVideo };

  // Fallback: fill missing captions from the latest social_captions artifact.
  const captionsArtifact = await getLatestCaptionsArtifact(
    supabase,
    auth.ctx.organizationId,
    episodeId,
  );
  const fallbackCaptions = captionsArtifact
    ? parseSocialCaptions(captionsArtifact)
    : null;

  for (const req of channelRequests) {
    if (!req.caption.trim() && fallbackCaptions) {
      const platformKey = req.platform.includes("youtube")
        ? "youtube"
        : req.platform.includes("tiktok")
          ? "tiktok"
          : "instagram";
      req.caption = renderPlatformCaption(platformKey, fallbackCaptions);
    }
    if (!req.caption.trim()) {
      return { error: ActionErrorCode.studioSchedulerCaptionRequired };
    }
  }

  const apiKey = await resolveBufferApiKey(supabase, auth.ctx.organizationId);
  if (!apiKey) return { error: ActionErrorCode.studioBufferNoKey };

  // Insert pending rows (unique via idempotency_key).
  type InsertRow =
    Database["public"]["Tables"]["studio_scheduled_posts"]["Insert"];
  const rowsToInsert: InsertRow[] = channelRequests.map((req) => ({
    organization_id: auth.ctx.organizationId,
    episode_id: episodeId,
    platform: req.platform,
    buffer_channel_id: req.channelId,
    caption: req.caption,
    video_url: videoUrl,
    scheduled_at: scheduledDate.toISOString(),
    status: "pending",
    idempotency_key: makeIdempotencyKey({
      organizationId: auth.ctx.organizationId,
      episodeId,
      channelId: req.channelId,
      scheduledAt: scheduledDate.toISOString(),
    }),
    created_by: auth.ctx.userId,
  }));

  const { data: inserted, error: insertErr } = await supabase
    .from("studio_scheduled_posts")
    .upsert(rowsToInsert, {
      onConflict: "organization_id,idempotency_key",
    })
    .select("id, buffer_channel_id, caption");

  if (insertErr || !inserted) {
    return { error: ActionErrorCode.dbError };
  }

  const results = await Promise.all(
    inserted.map(async (row) => {
      const post = await createBufferPost(apiKey, {
        channelId: row.buffer_channel_id,
        text: row.caption,
        scheduledAt: scheduledDate.toISOString(),
        mediaUrls: [videoUrl],
      });
      if (post.ok) {
        await supabase
          .from("studio_scheduled_posts")
          .update({
            status: "scheduled",
            buffer_post_id: post.postId,
            last_error: null,
            retry_count: 0,
            updated_at: new Date().toISOString(),
          })
          .eq("id", row.id)
          .eq("organization_id", auth.ctx.organizationId);
        return { rowId: row.id, ok: true as const };
      }
      await supabase
        .from("studio_scheduled_posts")
        .update({
          status: "failed",
          last_error:
            post.error.message?.slice(0, 500) ?? post.error.code,
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id)
        .eq("organization_id", auth.ctx.organizationId);
      return {
        rowId: row.id,
        ok: false as const,
        channelId: row.buffer_channel_id,
        error: mapBufferErrorCode(post.error),
      };
    }),
  );

  const okIds = results.filter((r) => r.ok).map((r) => r.rowId);
  const failures = results
    .filter((r): r is Extract<typeof r, { ok: false }> => !r.ok)
    .map((r) => ({ channelId: r.channelId, error: r.error }));

  void logAudit({
    organizationId: auth.ctx.organizationId,
    actorId: auth.ctx.userId,
    action: AuditAction.STUDIO_BUFFER_SCHEDULE,
    entityType: AuditEntityType.STUDIO_EPISODE,
    entityId: episodeId,
    metadata: {
      scheduled_at: scheduledDate.toISOString(),
      ok_count: okIds.length,
      fail_count: failures.length,
    },
  });

  revalidatePath(`/dashboard/productions/${episodeId}`);
  return {
    ok: okIds.length > 0,
    scheduledIds: okIds,
    failures: failures.length > 0 ? failures : undefined,
  };
}

export type ScheduledPostMutationState = {
  ok?: boolean;
  error?: string;
} | null;

export async function cancelScheduledPost(
  _prev: ScheduledPostMutationState,
  formData: FormData,
): Promise<ScheduledPostMutationState> {
  void _prev;
  const supabase = await createClient();
  const auth = await getOrgMemberContext(supabase);
  if (!auth.ok) return { error: auth.error };

  const id = String(formData.get("scheduled_post_id") ?? "").trim();
  if (!id) return { error: ActionErrorCode.unexpected };

  const { data: row } = await supabase
    .from("studio_scheduled_posts")
    .select("id, episode_id, status")
    .eq("id", id)
    .eq("organization_id", auth.ctx.organizationId)
    .maybeSingle();
  if (!row) return { error: ActionErrorCode.studioSchedulerInvalidStatus };
  if (row.status === "published") {
    return { error: ActionErrorCode.studioSchedulerInvalidStatus };
  }

  // For v1 we mark the row cancelled in our DB. Remote cancellation via
  // Buffer requires the post id and the deletePost mutation; we defer that
  // to the retry/cancel backfill worker to keep this action synchronous.
  const { error } = await supabase
    .from("studio_scheduled_posts")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("organization_id", auth.ctx.organizationId);
  if (error) return { error: ActionErrorCode.dbError };

  void logAudit({
    organizationId: auth.ctx.organizationId,
    actorId: auth.ctx.userId,
    action: AuditAction.STUDIO_BUFFER_CANCEL,
    entityType: AuditEntityType.STUDIO_EPISODE,
    entityId: row.episode_id,
    metadata: { scheduled_post_id: id },
  });

  revalidatePath(`/dashboard/productions/${row.episode_id}`);
  return { ok: true };
}

/**
 * Retry a previously-failed scheduled post row. Uses the same row so the
 * idempotency key is preserved; Buffer will treat the retry as a new create
 * (since the old attempt never produced a Buffer post id).
 */
export async function retryScheduledPost(
  _prev: ScheduledPostMutationState,
  formData: FormData,
): Promise<ScheduledPostMutationState> {
  void _prev;
  if (!readStudioIntegrationsServerEnabled()) {
    return { error: ActionErrorCode.studioIntegrationsDisabled };
  }
  if (!isStudioIntegrationsEncryptionConfigured()) {
    return { error: ActionErrorCode.studioIntegrationsEncryptionNotConfigured };
  }
  const supabase = await createClient();
  const auth = await getOrgMemberContext(supabase);
  if (!auth.ok) return { error: auth.error };

  const id = String(formData.get("scheduled_post_id") ?? "").trim();
  if (!id) return { error: ActionErrorCode.unexpected };

  const { data: row } = await supabase
    .from("studio_scheduled_posts")
    .select("*")
    .eq("id", id)
    .eq("organization_id", auth.ctx.organizationId)
    .maybeSingle();
  if (!row) return { error: ActionErrorCode.studioSchedulerInvalidStatus };
  if (row.status !== "failed" && row.status !== "pending") {
    return { error: ActionErrorCode.studioSchedulerInvalidStatus };
  }
  if (row.retry_count >= 3) {
    return { error: ActionErrorCode.studioBufferApiError };
  }

  const apiKey = await resolveBufferApiKey(supabase, auth.ctx.organizationId);
  if (!apiKey) return { error: ActionErrorCode.studioBufferNoKey };

  const post = await createBufferPost(apiKey, {
    channelId: row.buffer_channel_id,
    text: row.caption,
    scheduledAt: row.scheduled_at,
    mediaUrls: [row.video_url],
  });

  if (post.ok) {
    await supabase
      .from("studio_scheduled_posts")
      .update({
        status: "scheduled",
        buffer_post_id: post.postId,
        last_error: null,
        retry_count: row.retry_count + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id)
      .eq("organization_id", auth.ctx.organizationId);

    void logAudit({
      organizationId: auth.ctx.organizationId,
      actorId: auth.ctx.userId,
      action: AuditAction.STUDIO_BUFFER_RETRY,
      entityType: AuditEntityType.STUDIO_EPISODE,
      entityId: row.episode_id,
      metadata: { scheduled_post_id: row.id, retry: row.retry_count + 1 },
    });

    revalidatePath(`/dashboard/productions/${row.episode_id}`);
    return { ok: true };
  }

  await supabase
    .from("studio_scheduled_posts")
    .update({
      status: "failed",
      last_error: post.error.message?.slice(0, 500) ?? post.error.code,
      retry_count: row.retry_count + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", row.id)
    .eq("organization_id", auth.ctx.organizationId);

  return { error: mapBufferErrorCode(post.error) };
}
