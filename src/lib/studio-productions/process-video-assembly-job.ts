import type { SupabaseClient } from "@supabase/supabase-js";

import type { EditorOverlay } from "@/lib/studio-productions/editor-dsl";
import { assembleVideo } from "@/lib/studio-productions/video-assembly";
import {
  assembleVideoPerScene,
  perSceneJobClipsToSpecs,
} from "@/lib/studio-productions/assemble-video-per-scene";
import { uploadAssembledMp4ToContentStorage } from "@/lib/studio-productions/assembled-video-storage";
import { FORMAT_SPECS } from "@/lib/studio-productions/episode-format";
import {
  effectiveAssemblyClipCount,
  isVideoAssemblyJobInput,
  type VideoAssemblyJobInput,
} from "@/lib/studio-productions/video-assembly-job-input";
import { AuditAction, AuditEntityType } from "@/lib/audit/constants";
import { getContentStorageBucket } from "@/lib/env/content-storage";
import type { Database, Json } from "@/types/database.types";

type JobRow = Database["public"]["Tables"]["studio_video_assembly_jobs"]["Row"];

function parseEditorOverlayExtensions(raw: unknown): EditorOverlay[] | undefined {
  // Active today:
  // - overlays: consumed by both legacy and per-scene assembly
  //
  // Reserved for later implementation:
  // - scene_transitions_ms
  // - narration_gain_db
  // - bgm_gain_db / bgm_fade_in_sec / bgm_fade_out_sec
  // - resolution
  if (
    raw &&
    typeof raw === "object" &&
    Array.isArray((raw as { overlays?: unknown }).overlays)
  ) {
    return (raw as { overlays: unknown[] }).overlays as EditorOverlay[];
  }
  return undefined;
}

async function failJob(
  admin: SupabaseClient<Database>,
  jobId: string,
  message: string,
): Promise<void> {
  const trimmed = message.trim().slice(0, 2000);
  await admin
    .from("studio_video_assembly_jobs")
    .update({
      status: "failed",
      error_message: trimmed || "assembly_failed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", jobId);
}

/**
 * Runs FFmpeg assembly + Storage upload + artifact row for a claimed job row.
 * Used by the standalone worker (`workers/video-assembly/run.ts`).
 */
export async function processVideoAssemblyJob(
  admin: SupabaseClient<Database>,
  job: JobRow,
): Promise<void> {
  const raw = job.input;
  if (!isVideoAssemblyJobInput(raw)) {
    await failJob(admin, job.id, "invalid_job_input");
    return;
  }
  const input: VideoAssemblyJobInput = raw;
  const clipCount = effectiveAssemblyClipCount(input);
  // `editor_extensions` is only populated by the v3 editor export path.
  const overlays = parseEditorOverlayExtensions(
    (raw as { editor_extensions?: unknown }).editor_extensions,
  );

  const result =
    input.per_scene && input.per_scene.length > 0
      ? await assembleVideoPerScene({
          scenes: perSceneJobClipsToSpecs(input.per_scene),
          audioUrl: input.audio_url ?? undefined,
          srtContent: input.srt_content ?? undefined,
          bgMusicUrl: input.bg_music_url ?? undefined,
          bgMusicVolume: input.bg_music_volume ?? undefined,
          overlays,
        })
      : await assembleVideo({
          clipUrls: input.clip_urls,
          audioUrl: input.audio_url ?? undefined,
          srtContent: input.srt_content ?? undefined,
          bgMusicUrl: input.bg_music_url ?? undefined,
          bgMusicVolume: input.bg_music_volume ?? undefined,
          overlays,
        });

  if (!result.ok) {
    const detail = result.message ? `: ${result.message}` : "";
    await failJob(admin, job.id, `${result.code}${detail}`);
    return;
  }

  let publicUrl: string;
  let storagePathForMeta = "";
  try {
    const up = await uploadAssembledMp4ToContentStorage({
      organizationId: job.organization_id,
      episodeId: job.episode_id,
      jobId: job.id,
      body: result.outputBuffer,
    });
    publicUrl = up.publicUrl;
    storagePathForMeta = up.storagePath;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await failJob(admin, job.id, `storage_upload: ${msg}`);
    return;
  }

  const hasTts = Boolean(input.audio_url);
  const hasSub = Boolean(input.srt_content?.trim());
  const hasBg = Boolean(input.bg_music_url);

  const metadata: Record<string, Json> = {
    source: "ffmpeg_assembly",
    content_storage_bucket: getContentStorageBucket(),
    content_storage_path: storagePathForMeta,
    clip_count: clipCount,
    has_tts: hasTts,
    has_subtitles: hasSub,
    has_bg_music: hasBg,
    ...(input.bg_music_volume != null
      ? { bg_music_volume: input.bg_music_volume }
      : {}),
    duration_seconds: result.durationSeconds,
    resolution: FORMAT_SPECS[input.episode_format].resolution,
    codec: "h264_aac",
    assembled_at: new Date().toISOString(),
  };

  const { data: artifact, error: insertErr } = await admin
    .from("studio_production_artifacts")
    .insert({
      episode_id: job.episode_id,
      organization_id: job.organization_id,
      artifact_role: "assembled_video",
      tool_platform: "ffmpeg",
      content_text: `Assembled ${clipCount} clips, ${result.durationSeconds.toFixed(1)}s`,
      external_url: publicUrl,
      metadata,
    })
    .select("id")
    .single();

  if (insertErr || !artifact) {
    await failJob(admin, job.id, "artifact_insert_failed");
    return;
  }

  const { error: updErr } = await admin
    .from("studio_video_assembly_jobs")
    .update({
      status: "completed",
      output_artifact_id: artifact.id,
      completed_at: new Date().toISOString(),
    })
    .eq("id", job.id);

  if (updErr) {
    await failJob(admin, job.id, `job_update_failed: ${updErr.message}`);
    return;
  }

  try {
    await admin.from("audit_logs").insert({
      organization_id: job.organization_id,
      actor_id: job.created_by,
      action: AuditAction.STUDIO_VIDEO_ASSEMBLE,
      entity_type: AuditEntityType.STUDIO_EPISODE,
      entity_id: job.episode_id,
      metadata: {
        clip_count: clipCount,
        duration_seconds: result.durationSeconds,
        job_id: job.id,
      } as Json,
    });
  } catch {
    // best-effort
  }
}
