"use server";

import { revalidatePath } from "next/cache";
import { getOrgMemberContext } from "@/lib/auth/require-org-editor";
import { ActionErrorCode } from "@/lib/i18n/action-error-codes";
import { createClient } from "@/lib/supabase/server";
import { getStudioEpisodeForOrg } from "@/lib/data/studio-productions";
import { readStudioIntegrationsServerEnabled } from "@/lib/studio-integrations/feature";
import { isStudioIntegrationsEncryptionConfigured } from "@/lib/studio-integrations/crypto";
import { getOrgProviderApiKey } from "@/lib/studio-integrations/org-provider-secret";
import { runRunwayTextToVideo } from "@/lib/studio-integrations/providers/runway/runway-text-to-video";
import {
  splitScriptToScenes,
  parseLlmScenes,
  type SceneDefinition,
} from "@/lib/studio-productions/scene-splitter";
import { resolveEpisodeFormat, FORMAT_SPECS } from "@/lib/studio-productions/episode-format";
import { logAudit } from "@/lib/audit/log";
import { AuditAction, AuditEntityType } from "@/lib/audit/constants";
import type { Json } from "@/types/database.types";

export type SceneRenderActionState = {
  ok?: boolean;
  error?: string;
  sceneResults?: Array<{
    index: number;
    ok: boolean;
    artifactId?: string;
    error?: string;
  }>;
};

/**
 * Split episode script into scenes and render each via Runway Gen-4.5.
 * Scenes are processed sequentially to respect API rate limits.
 */
export async function renderEpisodeScenes(
  _prev: SceneRenderActionState | null,
  formData: FormData,
): Promise<SceneRenderActionState> {
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

  const runwayKey = await getOrgProviderApiKey(
    supabase,
    auth.ctx.organizationId,
    "runway",
  );
  if (!runwayKey) return { error: "studioSceneRenderNoRunwayKey" };

  const scriptText = String(formData.get("script_text") ?? "").trim();
  const scenesJsonRaw = String(formData.get("scenes_json") ?? "").trim();
  const targetSceneRaw = String(formData.get("target_scene_count") ?? "").trim();
  const targetSceneCountParsed = targetSceneRaw
    ? Number.parseInt(targetSceneRaw, 10)
    : NaN;
  const targetSceneCount = Number.isFinite(targetSceneCountParsed)
    ? Math.min(12, Math.max(3, targetSceneCountParsed))
    : undefined;

  let scenes: SceneDefinition[];

  if (scenesJsonRaw) {
    try {
      const parsed = JSON.parse(scenesJsonRaw);
      if (Array.isArray(parsed)) {
        scenes = parseLlmScenes(parsed).scenes;
      } else {
        return { error: "studioSceneRenderInvalidJson" };
      }
    } catch {
      return { error: "studioSceneRenderInvalidJson" };
    }
  } else if (scriptText) {
    scenes = splitScriptToScenes(scriptText, targetSceneCount).scenes;
  } else {
    return { error: "studioSceneRenderNoScript" };
  }

  if (scenes.length === 0) return { error: "studioSceneRenderNoScenes" };

  const format = resolveEpisodeFormat(episode);
  const { ratio } = FORMAT_SPECS[format];

  const sceneResults: SceneRenderActionState["sceneResults"] = [];

  for (const scene of scenes) {
    const result = await runRunwayTextToVideo(runwayKey, {
      promptText: scene.visualPrompt,
      ratio,
      duration: scene.durationSeconds,
    });

    if (!result.ok) {
      sceneResults.push({ index: scene.index, ok: false, error: result.code });
      continue;
    }

    const metadata: Record<string, Json> = {
      source: "runway",
      model: "gen4.5",
      scene_index: scene.index,
      narration: scene.narration.slice(0, 500),
      visual_prompt: scene.visualPrompt.slice(0, 500),
      duration_seconds: scene.durationSeconds,
      task_id: result.task_id,
      output_urls: result.output_urls,
      generated_at: new Date().toISOString(),
    };

    const { data: artifact, error: insertErr } = await supabase
      .from("studio_production_artifacts")
      .insert({
        episode_id: episodeId,
        organization_id: auth.ctx.organizationId,
        artifact_role: "scene_clip",
        tool_platform: "runway",
        content_text: scene.narration.slice(0, 500),
        external_url: result.output_urls[0] ?? null,
        metadata,
        sort_order: scene.index,
      })
      .select("id")
      .single();

    if (insertErr || !artifact) {
      sceneResults.push({ index: scene.index, ok: false, error: "insertFailed" });
    } else {
      sceneResults.push({ index: scene.index, ok: true, artifactId: artifact.id });
    }
  }

  void logAudit({
    organizationId: auth.ctx.organizationId,
    actorId: auth.ctx.userId,
    action: AuditAction.STUDIO_SCENE_RENDER,
    entityType: AuditEntityType.STUDIO_EPISODE,
    entityId: episodeId,
    metadata: { scene_count: scenes.length, format, ratio },
  });

  revalidatePath(`/dashboard/productions/${episodeId}`);
  const allOk = sceneResults.every((r) => r.ok);
  return { ok: allOk, sceneResults };
}
