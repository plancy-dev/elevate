"use server";

import { revalidatePath } from "next/cache";
import { getOrgMemberContext } from "@/lib/auth/require-org-editor";
import { ActionErrorCode } from "@/lib/i18n/action-error-codes";
import { createClient } from "@/lib/supabase/server";
import { getStudioEpisodeForOrg } from "@/lib/data/studio-productions";
import { resolveEpisodeFormat } from "@/lib/studio-productions/episode-format";
import { logAudit } from "@/lib/audit/log";
import { AuditAction, AuditEntityType } from "@/lib/audit/constants";
import { readStudioIntegrationsServerEnabled } from "@/lib/studio-integrations/feature";
import {
  isStudioIntegrationsEncryptionConfigured,
  encryptProviderSecret,
} from "@/lib/studio-integrations/crypto";
import {
  exchangeCodeForTokens,
  type YouTubeOAuthConfig,
} from "@/lib/studio-integrations/providers/youtube/youtube-oauth";
import {
  getStudioYouTubeChannelToken,
  resolveStudioYouTubeAccessToken,
  touchStudioYouTubeChannelToken,
  upsertStudioYouTubeChannelToken,
  type UntypedSupabaseClient,
} from "@/lib/studio-integrations/providers/youtube/youtube-channel-token";
import { uploadVideoToYouTube } from "@/lib/studio-integrations/providers/youtube/youtube-upload";

function getYouTubeOAuthConfig(): YouTubeOAuthConfig | null {
  const clientId = process.env.YOUTUBE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.YOUTUBE_OAUTH_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) return null;
  return { clientId, clientSecret, redirectUri };
}

export type YouTubeActionState = {
  ok?: boolean;
  error?: string;
  videoId?: string;
  videoUrl?: string;
};

/**
 * Exchange OAuth authorization code for tokens and save to DB.
 */
export async function connectYoutubeChannel(
  _prev: YouTubeActionState | null,
  formData: FormData,
): Promise<YouTubeActionState> {
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

  const config = getYouTubeOAuthConfig();
  if (!config) return { error: "studioYoutubeOAuthNotConfigured" };

  const code = String(formData.get("code") ?? "").trim();
  if (!code) return { error: ActionErrorCode.unexpected };

  const tokens = await exchangeCodeForTokens(config, code);
  if (!tokens) return { error: "studioYoutubeTokenExchangeFailed" };

  const ytTokenClient = supabase as unknown as UntypedSupabaseClient;
  const upsertOk = await upsertStudioYouTubeChannelToken(ytTokenClient, {
    organization_id: auth.ctx.organizationId,
    channel_id: tokens.channelId,
    channel_title: tokens.channelTitle,
    access_token_cipher: encryptProviderSecret(tokens.accessToken),
    refresh_token_cipher: encryptProviderSecret(tokens.refreshToken),
    scopes: "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly",
    token_expiry: tokens.expiresAt.toISOString(),
    connected_at: new Date().toISOString(),
  });

  if (!upsertOk) return { error: "studioYoutubeTokenSaveFailed" };

  revalidatePath("/dashboard/productions");
  return { ok: true };
}

/**
 * Upload an assembled video to YouTube for a given episode.
 * Uploads as `private` by default (Human-in-the-Loop compliance).
 */
export async function uploadEpisodeToYouTube(
  _prev: YouTubeActionState | null,
  formData: FormData,
): Promise<YouTubeActionState> {
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

  const config = getYouTubeOAuthConfig();
  if (!config) return { error: "studioYoutubeOAuthNotConfigured" };

  const ytTokenClient = supabase as unknown as UntypedSupabaseClient;
  const channelToken = await getStudioYouTubeChannelToken(
    ytTokenClient,
    auth.ctx.organizationId,
  );

  if (!channelToken) return { error: "studioYoutubeNoChannel" };

  const accessToken = await resolveStudioYouTubeAccessToken(
    ytTokenClient,
    channelToken,
    config,
  );
  if (!accessToken) return { error: "studioYoutubeTokenRefreshFailed" };

  const { data: videoArtifact } = await supabase
    .from("studio_production_artifacts")
    .select("external_url, metadata")
    .eq("episode_id", episodeId)
    .eq("artifact_role", "assembled_video")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!videoArtifact?.external_url) return { error: "studioYoutubeNoVideo" };

  let videoBuffer: Buffer;
  const url = videoArtifact.external_url;
  if (url.startsWith("data:")) {
    const base64Part = url.split(",")[1];
    if (!base64Part) return { error: "studioYoutubeInvalidVideo" };
    videoBuffer = Buffer.from(base64Part, "base64");
  } else {
    const res = await fetch(url);
    if (!res.ok) return { error: "studioYoutubeVideoFetchFailed" };
    videoBuffer = Buffer.from(await res.arrayBuffer());
  }

  const title = String(formData.get("title") ?? episode.title ?? "Untitled");
  const description = String(formData.get("description") ?? "");
  const tagsRaw = String(formData.get("tags") ?? "");
  const tags = tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : [];
  const privacyStatus = (formData.get("privacy") ?? "private") as "private" | "public" | "unlisted";

  const result = await uploadVideoToYouTube({
    accessToken,
    videoBuffer,
    title,
    description,
    tags,
    privacyStatus,
    isShort: resolveEpisodeFormat(episode) === "shorts",
    aiGenerated: true,
  });

  if (!result.ok) return { error: result.code };

  await supabase
    .from("studio_production_episodes")
    .update({
      publish_url: result.videoUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", episodeId);

  await touchStudioYouTubeChannelToken(ytTokenClient, channelToken.id);

  void logAudit({
    organizationId: auth.ctx.organizationId,
    actorId: auth.ctx.userId,
    action: AuditAction.STUDIO_YOUTUBE_UPLOAD,
    entityType: AuditEntityType.STUDIO_EPISODE,
    entityId: episodeId,
    metadata: { video_id: result.videoId, privacy: privacyStatus },
  });

  revalidatePath(`/dashboard/productions/${episodeId}`);
  return { ok: true, videoId: result.videoId, videoUrl: result.videoUrl };
}
