"use server";

import { revalidatePath } from "next/cache";
import { getOrgMemberContext } from "@/lib/auth/require-org-editor";
import { ActionErrorCode } from "@/lib/i18n/action-error-codes";
import { createClient } from "@/lib/supabase/server";
import { getStudioEpisodeForOrg } from "@/lib/data/studio-productions";
import { readStudioIntegrationsServerEnabled } from "@/lib/studio-integrations/feature";
import { isStudioIntegrationsEncryptionConfigured } from "@/lib/studio-integrations/crypto";
import { getOrgProviderApiKey } from "@/lib/studio-integrations/org-provider-secret";
import { runRunwayImageToVideo } from "@/lib/studio-integrations/providers/runway/runway-image-to-video";
import {
  DEFAULT_RUNWAY_I2V_MODEL,
  RUNWAY_I2V_MODELS,
  parseRunwayI2VModelId,
} from "@/lib/studio-integrations/providers/runway/runway-i2v-models";
import { parseCharacterBible } from "@/lib/studio-productions/character-bible";
import { buildSceneI2VPrompt } from "@/lib/studio-productions/scene-i2v-prompt";
import { parseSceneKeyframeMetadata } from "@/lib/studio-productions/scene-keyframe-metadata";
import { scenePlanRowsFromPipelinePrefs } from "@/lib/studio-productions/episode-scene-plan-dto";
import { resolveEpisodeFormat, FORMAT_SPECS } from "@/lib/studio-productions/episode-format";
import { STUDIO_CONTENT_TEXT_MAX } from "@/lib/studio-productions/constants";
import { logAudit } from "@/lib/audit/log";
import { AuditAction, AuditEntityType } from "@/lib/audit/constants";
import type { Json } from "@/types/database.types";

export type SceneI2VActionState = {
  ok?: boolean;
  error?: string;
  artifactId?: string;
} | null;

/**
 * Render a single scene clip with Runway image-to-video, using the scene's
 * `scene_keyframe_first` (required) and `scene_keyframe_last` (optional) as
 * frame anchors. The produced MP4 URL is persisted as a `scene_clip`
 * artifact tagged with `source: "runway_i2v"` so the existing assembly
 * pipeline picks it up like any other scene clip.
 */
export async function renderSceneWithI2V(
  _prev: SceneI2VActionState,
  formData: FormData,
): Promise<SceneI2VActionState> {
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
  const modelRaw = String(formData.get("model") ?? "").trim();
  const endStateHint = String(formData.get("end_state_hint") ?? "").trim();

  const sceneIndex = Number(sceneIndexRaw);
  if (!episodeId || !Number.isFinite(sceneIndex) || sceneIndex < 0) {
    return { error: ActionErrorCode.unexpected };
  }

  const model = modelRaw
    ? parseRunwayI2VModelId(modelRaw)
    : DEFAULT_RUNWAY_I2V_MODEL;

  const episode = await getStudioEpisodeForOrg(
    supabase,
    episodeId,
    auth.ctx.organizationId,
  );
  if (!episode) return { error: ActionErrorCode.studioEpisodeNotFound };

  // Load character bible from parent project (if any).
  let bible = null;
  if (episode.project_id) {
    const { data: proj } = await supabase
      .from("studio_projects")
      .select("character_bible")
      .eq("id", episode.project_id)
      .eq("organization_id", auth.ctx.organizationId)
      .maybeSingle();
    if (proj) bible = parseCharacterBible(proj.character_bible);
  }

  // Load first + last frame artifacts for the scene.
  const { data: artRows } = await supabase
    .from("studio_production_artifacts")
    .select("id, artifact_role, external_url, metadata")
    .eq("episode_id", episodeId)
    .eq("organization_id", auth.ctx.organizationId)
    .in("artifact_role", [
      "scene_keyframe_first",
      "scene_keyframe_last",
    ])
    .order("created_at", { ascending: false });

  let firstUrl: string | null = null;
  let lastUrl: string | null = null;
  for (const row of artRows ?? []) {
    const meta = parseSceneKeyframeMetadata(row.metadata as Json);
    if (!meta || meta.scene_index !== sceneIndex) continue;
    if (row.artifact_role === "scene_keyframe_first" && !firstUrl) {
      firstUrl = row.external_url ?? null;
    } else if (row.artifact_role === "scene_keyframe_last" && !lastUrl) {
      lastUrl = row.external_url ?? null;
    }
  }

  if (!firstUrl) {
    return { error: ActionErrorCode.studioRunwayI2vNoFirstFrame };
  }

  // Scene plan lives in `episode.pipeline_prefs.sceneRender.scenesJson`,
  // not as a settings/scene_plan artifact. See scenePlanRowsFromPipelinePrefs.
  const scenes = scenePlanRowsFromPipelinePrefs(episode.pipeline_prefs) ?? [];
  const sceneRow = scenes.find((s) => s.index === sceneIndex);
  if (!sceneRow) {
    return { error: ActionErrorCode.studioSceneRenderScenesInvalid };
  }

  const cap = RUNWAY_I2V_MODELS[model];
  const format = resolveEpisodeFormat(episode);
  const ratio = FORMAT_SPECS[format].ratio;

  const apiKey = await getOrgProviderApiKey(
    supabase,
    auth.ctx.organizationId,
    "runway",
  );
  if (!apiKey) {
    return { error: ActionErrorCode.studioSceneRenderNoRunwayKey };
  }

  const promptText = buildSceneI2VPrompt({
    bible,
    sceneDescription: sceneRow.narration,
    visualPrompt: sceneRow.visualPrompt,
    endStateHint: endStateHint || undefined,
    modelSupportsLastFrame: cap.supportsLastFrame,
  });

  const result = await runRunwayImageToVideo(apiKey, {
    promptText,
    firstFrameUrl: firstUrl,
    lastFrameUrl: cap.supportsLastFrame ? lastUrl ?? undefined : undefined,
    ratio,
    model,
    durationSec: sceneRow.durationSeconds,
  });

  if (!result.ok) {
    switch (result.code) {
      case "runway_i2v_missing_first_frame":
        return { error: ActionErrorCode.studioRunwayI2vNoFirstFrame };
      case "runway_i2v_insufficient_credits":
        return { error: ActionErrorCode.studioRunwayInsufficientCredits };
      case "runway_i2v_timeout":
        return { error: ActionErrorCode.studioRunwayTimeout };
      case "runway_i2v_task_failed":
        return { error: ActionErrorCode.studioRunwayTaskFailed };
      default:
        return { error: ActionErrorCode.studioRunwayApiError };
    }
  }

  // Persist as scene_clip with source=runway_i2v metadata so assembly sees it.
  const { data: max } = await supabase
    .from("studio_production_artifacts")
    .select("sort_order")
    .eq("episode_id", episodeId)
    .eq("organization_id", auth.ctx.organizationId)
    .order("sort_order", { ascending: false })
    .limit(1);
  const nextOrder = (max?.[0]?.sort_order ?? -1) + 1;

  const primaryUrl = result.output_urls[0] ?? "";
  const content = `scene ${sceneIndex}: runway i2v clip`.slice(
    0,
    STUDIO_CONTENT_TEXT_MAX,
  );

  const { data: inserted, error } = await supabase
    .from("studio_production_artifacts")
    .insert({
      organization_id: auth.ctx.organizationId,
      episode_id: episodeId,
      artifact_role: "scene_clip",
      tool_platform: "runway",
      content_text: content,
      external_url: primaryUrl.length > 0 ? primaryUrl : null,
      metadata: {
        source: "runway_i2v",
        runway_task_id: result.task_id,
        output_urls: result.output_urls,
        model,
        ratio,
        scene_index: sceneIndex,
        target_duration_sec: sceneRow.durationSeconds,
        duration_seconds: sceneRow.durationSeconds,
        first_frame_url: firstUrl,
        last_frame_url: cap.supportsLastFrame ? lastUrl : null,
        prompt_used: promptText,
      } as Json,
      sort_order: nextOrder,
    })
    .select("id")
    .single();

  if (error) {
    return { error: ActionErrorCode.dbError };
  }

  void logAudit({
    organizationId: auth.ctx.organizationId,
    actorId: auth.ctx.userId,
    action: AuditAction.STUDIO_RUNWAY_I2V,
    entityType: AuditEntityType.STUDIO_EPISODE,
    entityId: episodeId,
    metadata: {
      scene_index: sceneIndex,
      model,
      with_last_frame: Boolean(cap.supportsLastFrame && lastUrl),
    },
  });

  revalidatePath(`/dashboard/productions/${episodeId}`);
  return { ok: true, artifactId: inserted?.id };
}
