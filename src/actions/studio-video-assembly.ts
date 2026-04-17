"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { getOrgMemberContext } from "@/lib/auth/require-org-editor";
import { ActionErrorCode } from "@/lib/i18n/action-error-codes";
import { createClient } from "@/lib/supabase/server";
import { getStudioEpisodeForOrg } from "@/lib/data/studio-productions";
import { readStudioIntegrationsServerEnabled } from "@/lib/studio-integrations/feature";
import { isStudioIntegrationsEncryptionConfigured } from "@/lib/studio-integrations/crypto";
import { assembleVideo } from "@/lib/studio-productions/video-assembly";
import { resolveEpisodeFormat, FORMAT_SPECS } from "@/lib/studio-productions/episode-format";
import { readStudioVideoAssemblyMode } from "@/lib/studio-productions/studio-video-assembly-mode";
import { uploadAssembledMp4ToContentStorage } from "@/lib/studio-productions/assembled-video-storage";
import { getContentStorageBucket } from "@/lib/env/content-storage";
import type { VideoAssemblyJobInput } from "@/lib/studio-productions/video-assembly-job-input";
import { logAudit } from "@/lib/audit/log";
import { AuditAction, AuditEntityType } from "@/lib/audit/constants";
import type { Json } from "@/types/database.types";

export type VideoAssemblyActionState = {
  ok?: boolean;
  error?: string;
  artifactId?: string;
  durationSeconds?: number;
  /** Set when assembly is async (default): job row for the FFmpeg worker. */
  jobId?: string;
};

/**
 * Assemble a final Shorts video from scene clips + TTS audio + SRT subtitles.
 * Default: enqueues a DB job (`async`) for the worker; set `STUDIO_VIDEO_ASSEMBLY_MODE=sync` to run ffmpeg
 * inside this Next.js process (local ffmpeg required).
 */
export async function assembleEpisodeVideo(
  _prev: VideoAssemblyActionState | null,
  formData: FormData,
): Promise<VideoAssemblyActionState> {
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

  const { data: artifacts } = await supabase
    .from("studio_production_artifacts")
    .select("artifact_role, external_url, content_text, sort_order, metadata")
    .eq("episode_id", episodeId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (!artifacts || artifacts.length === 0) {
    return { error: ActionErrorCode.studioAssemblyNoArtifacts };
  }

  const clipUrls = artifacts
    .filter((a) => a.artifact_role === "scene_clip" && a.external_url)
    .map((a) => a.external_url!);

  if (clipUrls.length === 0) return { error: ActionErrorCode.studioAssemblyNoClips };

  const ttsArtifact = artifacts.find(
    (a) => a.artifact_role === "tts_audio" && a.external_url,
  );
  const srtArtifact = artifacts.find(
    (a) => a.artifact_role === "subtitle_srt" && a.content_text,
  );

  const bgMusicUrl = String(formData.get("bg_music_url") ?? "").trim() || undefined;
  const bgVolRaw = String(formData.get("bg_music_volume") ?? "").trim();
  const bgVolParsed = bgVolRaw ? Number.parseFloat(bgVolRaw) : NaN;
  const bgMusicVolume = Number.isFinite(bgVolParsed)
    ? Math.min(0.35, Math.max(0.05, bgVolParsed))
    : undefined;

  const episodeFormat = resolveEpisodeFormat(episode);
  const jobInput: VideoAssemblyJobInput = {
    clip_urls: clipUrls,
    audio_url: ttsArtifact?.external_url ?? null,
    srt_content: srtArtifact?.content_text ?? null,
    bg_music_url: bgMusicUrl ?? null,
    bg_music_volume: bgMusicVolume ?? null,
    episode_format: episodeFormat,
  };

  const mode = readStudioVideoAssemblyMode();

  if (mode === "async") {
    const { data: job, error: jobErr } = await supabase
      .from("studio_video_assembly_jobs")
      .insert({
        episode_id: episodeId,
        organization_id: auth.ctx.organizationId,
        status: "pending",
        input: jobInput as unknown as Json,
        created_by: auth.ctx.userId,
      })
      .select("id")
      .single();

    if (jobErr || !job) {
      return { error: ActionErrorCode.studioAssemblyInsertFailed };
    }

    revalidatePath(`/dashboard/productions/${episodeId}`);
    return { ok: true, jobId: job.id };
  }

  const result = await assembleVideo({
    clipUrls,
    audioUrl: ttsArtifact?.external_url ?? undefined,
    srtContent: srtArtifact?.content_text ?? undefined,
    bgMusicUrl,
    bgMusicVolume,
  });

  if (!result.ok) {
    if (result.code === "ffmpeg_not_found") {
      return { error: ActionErrorCode.studioAssemblyFfmpegNotFound };
    }
    if (result.code === "ffmpeg_error") {
      return { error: ActionErrorCode.studioAssemblyFfmpegError };
    }
    if (result.code === "no_clips") {
      return { error: ActionErrorCode.studioAssemblyNoClips };
    }
    if (result.code === "download_failed") {
      return { error: ActionErrorCode.studioAssemblyDownloadFailed };
    }
    return { error: ActionErrorCode.unexpected };
  }

  let externalUrl: string;
  let contentStoragePath: string | null = null;
  try {
    const up = await uploadAssembledMp4ToContentStorage({
      organizationId: auth.ctx.organizationId,
      episodeId,
      jobId: randomUUID(),
      body: result.outputBuffer,
    });
    externalUrl = up.publicUrl;
    contentStoragePath = up.storagePath;
  } catch {
    const base64Video = result.outputBuffer.toString("base64");
    externalUrl = `data:video/mp4;base64,${base64Video}`;
  }

  const metadata: Record<string, Json> = {
    source: "ffmpeg_assembly",
    ...(contentStoragePath
      ? {
          content_storage_bucket: getContentStorageBucket(),
          content_storage_path: contentStoragePath,
        }
      : {}),
    clip_count: clipUrls.length,
    has_tts: !!ttsArtifact,
    has_subtitles: !!srtArtifact,
    has_bg_music: !!bgMusicUrl,
    ...(bgMusicVolume != null ? { bg_music_volume: bgMusicVolume } : {}),
    duration_seconds: result.durationSeconds,
    resolution: FORMAT_SPECS[episodeFormat].resolution,
    codec: "h264_aac",
    assembled_at: new Date().toISOString(),
  };

  const { data: artifact, error: insertErr } = await supabase
    .from("studio_production_artifacts")
    .insert({
      episode_id: episodeId,
      organization_id: auth.ctx.organizationId,
      artifact_role: "assembled_video",
      tool_platform: "ffmpeg",
      content_text: `Assembled ${clipUrls.length} clips, ${result.durationSeconds.toFixed(1)}s`,
      external_url: externalUrl,
      metadata,
    })
    .select("id")
    .single();

  if (insertErr || !artifact) {
    return { error: ActionErrorCode.studioAssemblyInsertFailed };
  }

  void logAudit({
    organizationId: auth.ctx.organizationId,
    actorId: auth.ctx.userId,
    action: AuditAction.STUDIO_VIDEO_ASSEMBLE,
    entityType: AuditEntityType.STUDIO_EPISODE,
    entityId: episodeId,
    metadata: { clip_count: clipUrls.length, duration_seconds: result.durationSeconds },
  });

  revalidatePath(`/dashboard/productions/${episodeId}`);
  return { ok: true, artifactId: artifact.id, durationSeconds: result.durationSeconds };
}
