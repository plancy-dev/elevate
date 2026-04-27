"use server";

import { revalidatePath } from "next/cache";
import { getOrgMemberContext } from "@/lib/auth/require-org-editor";
import { ActionErrorCode } from "@/lib/i18n/action-error-codes";
import { createClient } from "@/lib/supabase/server";
import { getStudioEpisodeForOrg } from "@/lib/data/studio-productions";
import { readStudioIntegrationsServerEnabled } from "@/lib/studio-integrations/feature";
import { isStudioIntegrationsEncryptionConfigured } from "@/lib/studio-integrations/crypto";
import { resolveOrgLlmCredentialForDraftModel } from "@/lib/studio-productions/episode-llm";
import { DEFAULT_PACKAGING_DRAFT_MODEL_ID } from "@/lib/studio-productions/episode-llm-models";
import {
  buildSocialCaptionUserMessage,
  parseSocialCaptions,
  SOCIAL_CAPTION_SYSTEM_PROMPT,
  type SocialCaptions,
} from "@/lib/studio-productions/social-captions";
import { draftTripleFromArtifactTimestamps } from "@/lib/studio-productions/resolve-episode-draft-artifacts";
import { STUDIO_CONTENT_TEXT_MAX } from "@/lib/studio-productions/constants";
import { normalizeArtifactMetadataForWrite } from "@/lib/studio-productions/artifact-metadata-schemas";
import { logAudit } from "@/lib/audit/log";
import { AuditAction, AuditEntityType } from "@/lib/audit/constants";
import type { Json } from "@/types/database.types";

export type GenerateCaptionsState = {
  ok?: boolean;
  error?: string;
  captions?: SocialCaptions;
} | null;

/**
 * Generate platform-specific captions (Instagram / TikTok / YouTube Shorts)
 * from the latest script draft via the org's chosen LLM. Result is stored as
 * a `social_captions` artifact (JSON content_text) so the PublishScheduler
 * can edit and re-use it without re-invoking the LLM.
 */
export async function generateSocialCaptions(
  _prev: GenerateCaptionsState,
  formData: FormData,
): Promise<GenerateCaptionsState> {
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
  if (!episodeId) return { error: ActionErrorCode.unexpected };

  const episode = await getStudioEpisodeForOrg(
    supabase,
    episodeId,
    auth.ctx.organizationId,
  );
  if (!episode) return { error: ActionErrorCode.studioEpisodeNotFound };

  const { data: artRows, error: artErr } = await supabase
    .from("studio_production_artifacts")
    .select("artifact_role, content_text, created_at")
    .eq("episode_id", episodeId)
    .eq("organization_id", auth.ctx.organizationId)
    .in("artifact_role", ["hook", "title", "script_draft", "script"]);

  if (artErr) return { error: ActionErrorCode.dbError };

  const triple = draftTripleFromArtifactTimestamps(artRows ?? []);
  const latestScript = (artRows ?? [])
    .filter((r) => r.artifact_role === "script")
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )[0];
  const script = (triple.script_draft.trim() ||
    latestScript?.content_text?.trim() ||
    "").trim();
  if (!script) {
    return { error: ActionErrorCode.studioPipelineNeedScript };
  }

  const modelRaw = String(formData.get("model") ?? "").trim();
  const model = modelRaw || DEFAULT_PACKAGING_DRAFT_MODEL_ID;
  const resolved = await resolveOrgLlmCredentialForDraftModel(
    supabase,
    auth.ctx.organizationId,
    model,
  );
  if (!resolved.ok) return { error: ActionErrorCode.studioLlmNoProvider };

  // Brand voice from parent project (when any).
  let brandVoice: string | undefined;
  if (episode.project_id) {
    const { data: proj } = await supabase
      .from("studio_projects")
      .select("brand_guide")
      .eq("id", episode.project_id)
      .eq("organization_id", auth.ctx.organizationId)
      .maybeSingle();
    if (proj?.brand_guide?.trim()) brandVoice = proj.brand_guide.trim();
  }

  const userMsg = buildSocialCaptionUserMessage({
    topic: episode.title,
    script,
    hook: triple.hook,
    workingTitle: triple.title,
    brandVoice,
  });

  let rawText = "";
  const { cred, model: resolvedModel } = resolved;
  if (cred.provider === "openai") {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cred.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: resolvedModel,
        temperature: 0.6,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SOCIAL_CAPTION_SYSTEM_PROMPT },
          { role: "user", content: userMsg },
        ],
      }),
    });
    if (!res.ok) return { error: ActionErrorCode.studioLlmRequestFailed };
    const body = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    rawText = body.choices?.[0]?.message?.content ?? "";
  } else {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": cred.apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: resolvedModel,
        max_tokens: 1500,
        system: SOCIAL_CAPTION_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMsg }],
      }),
    });
    if (!res.ok) return { error: ActionErrorCode.studioLlmRequestFailed };
    const body = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    rawText = body.content?.find((c) => c.type === "text")?.text ?? "";
  }

  const captions = parseSocialCaptions(rawText);
  if (!captions) return { error: ActionErrorCode.studioCaptionsLlmBadResponse };

  // Persist as a `social_captions` artifact (latest wins). The serialized JSON
  // is the canonical form; PublishScheduler edits come back through the same
  // artifact on save.
  const contentText = JSON.stringify(captions, null, 2).slice(
    0,
    STUDIO_CONTENT_TEXT_MAX,
  );
  const meta: Record<string, Json> = {
    source: "llm_social_captions",
    model: resolvedModel,
    provider: cred.provider,
    generated_at: new Date().toISOString(),
  };

  const { data: existing } = await supabase
    .from("studio_production_artifacts")
    .select("id")
    .eq("episode_id", episodeId)
    .eq("organization_id", auth.ctx.organizationId)
    .eq("artifact_role", "social_captions")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    await supabase
      .from("studio_production_artifacts")
      .update({
        content_text: contentText,
        metadata: normalizeArtifactMetadataForWrite(
          "social_captions",
          meta as Json,
        ),
        tool_platform: cred.provider,
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("studio_production_artifacts").insert({
      organization_id: auth.ctx.organizationId,
      episode_id: episodeId,
      artifact_role: "social_captions",
      tool_platform: cred.provider,
      content_text: contentText,
      metadata: normalizeArtifactMetadataForWrite("social_captions", meta as Json),
      sort_order: 55,
    });
  }

  void logAudit({
    organizationId: auth.ctx.organizationId,
    actorId: auth.ctx.userId,
    action: AuditAction.STUDIO_CAPTIONS_GENERATE,
    entityType: AuditEntityType.STUDIO_EPISODE,
    entityId: episodeId,
    metadata: { model: resolvedModel, provider: cred.provider },
  });

  revalidatePath(`/dashboard/productions/${episodeId}`);
  return { ok: true, captions };
}

/**
 * Save manually-edited captions without re-running the LLM.
 */
export async function saveSocialCaptionsManual(
  _prev: GenerateCaptionsState,
  formData: FormData,
): Promise<GenerateCaptionsState> {
  void _prev;
  const supabase = await createClient();
  const auth = await getOrgMemberContext(supabase);
  if (!auth.ok) return { error: auth.error };

  const episodeId = String(formData.get("episode_id") ?? "").trim();
  if (!episodeId) return { error: ActionErrorCode.unexpected };

  const instagram = String(formData.get("caption_instagram") ?? "").trim();
  const tiktok = String(formData.get("caption_tiktok") ?? "").trim();
  const youtubeTitle = String(formData.get("caption_youtube_title") ?? "").trim();
  const youtubeDescription = String(
    formData.get("caption_youtube_description") ?? "",
  ).trim();

  if (!instagram || !tiktok || !youtubeTitle || !youtubeDescription) {
    return { error: ActionErrorCode.studioSchedulerCaptionRequired };
  }

  const captions = {
    instagram,
    tiktok,
    youtube: { title: youtubeTitle, description: youtubeDescription },
  };
  const contentText = JSON.stringify(captions, null, 2).slice(
    0,
    STUDIO_CONTENT_TEXT_MAX,
  );
  const meta: Record<string, Json> = {
    source: "manual_edit",
    saved_at: new Date().toISOString(),
  };

  const { data: existing } = await supabase
    .from("studio_production_artifacts")
    .select("id")
    .eq("episode_id", episodeId)
    .eq("organization_id", auth.ctx.organizationId)
    .eq("artifact_role", "social_captions")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase
      .from("studio_production_artifacts")
      .update({
        content_text: contentText,
        metadata: normalizeArtifactMetadataForWrite(
          "social_captions",
          meta as Json,
        ),
        tool_platform: "elevate",
      })
      .eq("id", existing.id);
    if (error) return { error: ActionErrorCode.dbError };
  } else {
    const { error } = await supabase.from("studio_production_artifacts").insert({
      organization_id: auth.ctx.organizationId,
      episode_id: episodeId,
      artifact_role: "social_captions",
      tool_platform: "elevate",
      content_text: contentText,
      metadata: normalizeArtifactMetadataForWrite("social_captions", meta as Json),
      sort_order: 55,
    });
    if (error) return { error: ActionErrorCode.dbError };
  }

  revalidatePath(`/dashboard/productions/${episodeId}`);
  return { ok: true, captions };
}
