"use server";

import { revalidatePath } from "next/cache";

import { getOrgMemberContext } from "@/lib/auth/require-org-editor";
import { ActionErrorCode } from "@/lib/i18n/action-error-codes";
import { createClient } from "@/lib/supabase/server";
import { getStudioEpisodeForOrg } from "@/lib/data/studio-productions";
import { readStudioIntegrationsServerEnabled } from "@/lib/studio-integrations/feature";
import { isStudioIntegrationsEncryptionConfigured } from "@/lib/studio-integrations/crypto";
import { parseSceneRows } from "@/lib/studio-productions/scene-rows-json";
import { scenesJsonFromEpisodePipelinePrefs } from "@/lib/studio-productions/build-video-assembly-input";
import { uploadSceneClipToContentStorage } from "@/lib/studio-productions/scene-clip-storage";
import { logAudit } from "@/lib/audit/log";
import { AuditAction, AuditEntityType } from "@/lib/audit/constants";
import type { Json } from "@/types/database.types";

const DEFAULT_MAX_BYTES = 500 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["video/mp4", "video/quicktime", "video/webm"]);

export type StudioSceneClipUploadState = {
  ok?: boolean;
  error?: string;
  artifactId?: string;
};

function maxUploadBytes(): number {
  const raw = process.env.SCENE_UPLOAD_MAX_BYTES?.trim();
  if (!raw) return DEFAULT_MAX_BYTES;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_MAX_BYTES;
}

async function deleteSceneClipsAtIndex(
  supabase: Awaited<ReturnType<typeof createClient>>,
  episodeId: string,
  organizationId: string,
  sceneIndex: number,
) {
  const { data: rows } = await supabase
    .from("studio_production_artifacts")
    .select("id, metadata")
    .eq("episode_id", episodeId)
    .eq("organization_id", organizationId)
    .eq("artifact_role", "scene_clip");

  const ids =
    rows
      ?.filter((r) => {
        const m = r.metadata as { scene_index?: number } | null;
        return m?.scene_index === sceneIndex;
      })
      .map((r) => r.id) ?? [];

  if (ids.length > 0) {
    await supabase.from("studio_production_artifacts").delete().in("id", ids);
  }
}

/**
 * Upload a user video file for one scene (replaces any existing clip for that index).
 */
export async function uploadStudioSceneClip(
  _prev: StudioSceneClipUploadState | null,
  formData: FormData,
): Promise<StudioSceneClipUploadState> {
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
  const sceneIndexRaw = String(formData.get("scene_index") ?? "").trim();
  const sceneIndex = Number.parseInt(sceneIndexRaw, 10);
  if (!episodeId || !Number.isFinite(sceneIndex) || sceneIndex < 0) {
    return { error: ActionErrorCode.unexpected };
  }

  const episode = await getStudioEpisodeForOrg(
    supabase,
    episodeId,
    auth.ctx.organizationId,
  );
  if (!episode) return { error: ActionErrorCode.studioEpisodeNotFound };

  const scenesJson = scenesJsonFromEpisodePipelinePrefs(episode.pipeline_prefs);
  const rows = parseSceneRows(scenesJson);
  const row = rows?.find((r) => r.index === sceneIndex);
  if (!row) {
    return { error: ActionErrorCode.studioScenePlanMissing };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: ActionErrorCode.unexpected };
  }

  const maxB = maxUploadBytes();
  if (file.size > maxB) {
    return { error: ActionErrorCode.studioSceneUploadTooLarge };
  }

  const mime = file.type || "application/octet-stream";
  if (!ALLOWED_TYPES.has(mime)) {
    return { error: ActionErrorCode.studioSceneUploadInvalidType };
  }

  const trimRaw = String(formData.get("trim_start_sec") ?? "").trim();
  const trimParsed = trimRaw ? Number.parseFloat(trimRaw) : 0;
  const trimStartSec = Number.isFinite(trimParsed) && trimParsed >= 0 ? trimParsed : 0;

  const loopField = formData.get("loop");
  const loop =
    loopField === null ? true : loopField === "1" || loopField === "on";

  let buffer: Buffer;
  try {
    buffer = Buffer.from(await file.arrayBuffer());
  } catch {
    return { error: ActionErrorCode.unexpected };
  }

  let publicUrl: string;
  try {
    const up = await uploadSceneClipToContentStorage({
      organizationId: auth.ctx.organizationId,
      episodeId,
      sceneIndex,
      body: buffer,
      contentType: mime,
    });
    publicUrl = up.publicUrl;
  } catch {
    return { error: ActionErrorCode.unexpected };
  }

  await deleteSceneClipsAtIndex(supabase, episodeId, auth.ctx.organizationId, sceneIndex);

  const metadata: Record<string, Json> = {
    source: "upload",
    scene_index: sceneIndex,
    target_duration_sec: row.durationSeconds,
    trim_start_sec: trimStartSec,
    loop,
    uploaded_at: new Date().toISOString(),
  };

  const { data: artifact, error: insErr } = await supabase
    .from("studio_production_artifacts")
    .insert({
      episode_id: episodeId,
      organization_id: auth.ctx.organizationId,
      artifact_role: "scene_clip",
      tool_platform: "upload",
      content_text: `Scene ${sceneIndex + 1} (upload)`,
      external_url: publicUrl,
      metadata,
      sort_order: sceneIndex,
    })
    .select("id")
    .single();

  if (insErr || !artifact) {
    return { error: ActionErrorCode.studioSceneUploadInsertFailed };
  }

  void logAudit({
    organizationId: auth.ctx.organizationId,
    actorId: auth.ctx.userId,
    action: AuditAction.STUDIO_SCENE_RENDER,
    entityType: AuditEntityType.STUDIO_EPISODE,
    entityId: episodeId,
    metadata: { scene_clip_upload: sceneIndex },
  });

  revalidatePath(`/dashboard/productions/${episodeId}`);
  return { ok: true, artifactId: artifact.id };
}
