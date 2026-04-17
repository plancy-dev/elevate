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
  parseRunwaySceneModelId,
  type RunwayTextToVideoModelId,
} from "@/lib/studio-integrations/providers/runway/runway-scene-models";
import type { SceneDefinition } from "@/lib/studio-productions/scene-splitter";
import { resolveEpisodeScenes } from "@/lib/studio-productions/resolve-episode-scenes";
import { buildRunwayScenePrompt } from "@/lib/studio-productions/scene-visual-brand";
import {
  checkSceneDurationBudget,
  SCENE_BUDGET_MAX_TOTAL_SECONDS,
} from "@/lib/studio-productions/scene-budget";
import { mapWithConcurrency } from "@/lib/studio-productions/scene-parallel";
import { generateScenesWithLlm } from "@/lib/studio-productions/scene-llm-planner";
import { resolveOrgLlmCredentialForDraftModel } from "@/lib/studio-productions/episode-llm";
import { DEFAULT_PACKAGING_DRAFT_MODEL_ID } from "@/lib/studio-productions/episode-llm-models";
import { resolveEpisodeFormat, FORMAT_SPECS } from "@/lib/studio-productions/episode-format";
import { logAudit } from "@/lib/audit/log";
import { AuditAction, AuditEntityType } from "@/lib/audit/constants";
import type { Json } from "@/types/database.types";

const PARALLEL_SCENES = 3;

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

export type SceneRenderPrepareState = {
  ok?: boolean;
  error?: string;
  /** Serialized SceneDefinition[] for client orchestration */
  scenesPayload?: string;
  totalDurationSeconds?: number;
  budgetWarning?: "overSoftBudget";
  budgetBlocked?: boolean;
};

export type SceneRenderSingleState = {
  ok?: boolean;
  error?: string;
  index?: number;
  artifactId?: string;
};

export type SceneRenderLlmPlanState = {
  ok?: boolean;
  error?: string;
  scenesJson?: string;
};

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

function brandGuideFromEpisode(
  episode: NonNullable<Awaited<ReturnType<typeof getStudioEpisodeForOrg>>>,
): string | null {
  const p = episode.studio_projects;
  if (p && typeof p === "object" && "brand_guide" in p) {
    const g = (p as { brand_guide?: string }).brand_guide;
    return typeof g === "string" && g.trim() ? g.trim() : null;
  }
  return null;
}

function runwayFailureToActionError(code: string): string {
  switch (code) {
    case "runway_insufficient_credits":
      return ActionErrorCode.studioRunwayInsufficientCredits;
    case "runway_empty_prompt":
      return ActionErrorCode.studioRunwayPromptRequired;
    case "runway_task_failed":
      return ActionErrorCode.studioRunwayTaskFailed;
    case "runway_timeout":
      return ActionErrorCode.studioRunwayTimeout;
    case "runway_api_error":
      return ActionErrorCode.studioRunwayApiError;
    default:
      return ActionErrorCode.studioRunwayApiError;
  }
}

async function renderOneScene(params: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  runwayKey: string;
  episodeId: string;
  organizationId: string;
  scene: SceneDefinition;
  ratio: "1280:720" | "720:1280";
  brandGuide: string | null;
  runwayModel: RunwayTextToVideoModelId;
  visualPromptSuffix: string | null;
}): Promise<{ index: number; ok: boolean; artifactId?: string; error?: string }> {
  const {
    supabase,
    runwayKey,
    episodeId,
    organizationId,
    scene,
    ratio,
    brandGuide,
    runwayModel,
    visualPromptSuffix,
  } = params;

  const promptText = buildRunwayScenePrompt(scene.visualPrompt, brandGuide, visualPromptSuffix);

  const result = await runRunwayTextToVideo(runwayKey, {
    promptText,
    ratio,
    duration: scene.durationSeconds,
    model: runwayModel,
  });

  if (!result.ok) {
    return { index: scene.index, ok: false, error: runwayFailureToActionError(result.code) };
  }

  const metadata: Record<string, Json> = {
    source: "runway",
    model: runwayModel,
    scene_index: scene.index,
    narration: scene.narration.slice(0, 500),
    visual_prompt: promptText.slice(0, 500),
    duration_seconds: scene.durationSeconds,
    task_id: result.task_id,
    output_urls: result.output_urls,
    generated_at: new Date().toISOString(),
  };

  const { data: artifact, error: insertErr } = await supabase
    .from("studio_production_artifacts")
    .insert({
      episode_id: episodeId,
      organization_id: organizationId,
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
    return { index: scene.index, ok: false, error: "insertFailed" };
  }
  return { index: scene.index, ok: true, artifactId: artifact.id };
}

/**
 * Validate scene plan + budget; returns serialized scenes for client-side batched render.
 */
export async function prepareSceneRenderPlan(
  _prev: SceneRenderPrepareState | null,
  formData: FormData,
): Promise<SceneRenderPrepareState> {
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

  const resolved = await resolveEpisodeScenes({
    supabase,
    episodeId,
    organizationId: auth.ctx.organizationId,
    scriptText,
    scenesJsonRaw,
    targetSceneCount,
  });

  if (!resolved.ok) {
    return { error: resolved.error };
  }

  const budget = checkSceneDurationBudget(resolved.scenes);
  if (budget.block) {
    return {
      error: "studioSceneRenderBudgetExceeded",
      totalDurationSeconds: budget.totalSeconds,
      budgetBlocked: true,
    };
  }

  return {
    ok: true,
    scenesPayload: JSON.stringify(resolved.scenes),
    totalDurationSeconds: budget.totalSeconds,
    budgetWarning: budget.warn,
  };
}

/**
 * Render a single scene by index; replaces existing clip at that index when `replace` is set.
 */
export async function renderSceneAtIndex(
  _prev: SceneRenderSingleState | null,
  formData: FormData,
): Promise<SceneRenderSingleState> {
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
  const scenesPayload = String(formData.get("scenes_payload") ?? "").trim();
  const indexRaw = String(formData.get("scene_index") ?? "").trim();
  const replace = String(formData.get("replace_existing") ?? "") === "1";

  const sceneIndex = Number.parseInt(indexRaw, 10);
  if (!episodeId || !scenesPayload || !Number.isFinite(sceneIndex) || sceneIndex < 0) {
    return { error: ActionErrorCode.unexpected };
  }

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

  const runwayModel = parseRunwaySceneModelId(String(formData.get("runway_model") ?? ""));
  const visualSuffixRaw = String(formData.get("visual_prompt_suffix") ?? "");
  const visualPromptSuffix = visualSuffixRaw.trim() ? visualSuffixRaw : null;

  let scenes: SceneDefinition[];
  try {
    scenes = JSON.parse(scenesPayload) as SceneDefinition[];
  } catch {
    return { error: "studioSceneRenderInvalidJson" };
  }
  const scene = scenes.find((s) => s.index === sceneIndex);
  if (!scene) return { error: ActionErrorCode.unexpected };

  if (replace) {
    await deleteSceneClipsAtIndex(
      supabase,
      episodeId,
      auth.ctx.organizationId,
      sceneIndex,
    );
  }

  const format = resolveEpisodeFormat(episode);
  const { ratio } = FORMAT_SPECS[format];
  const brandGuide = brandGuideFromEpisode(episode);

  const one = await renderOneScene({
    supabase,
    runwayKey,
    episodeId,
    organizationId: auth.ctx.organizationId,
    scene,
    ratio,
    brandGuide,
    runwayModel,
    visualPromptSuffix,
  });

  revalidatePath(`/dashboard/productions/${episodeId}`);

  if (!one.ok) {
    return { error: one.error ?? "unexpected", index: sceneIndex };
  }
  return { ok: true, index: sceneIndex, artifactId: one.artifactId };
}

/**
 * LLM: propose scenes JSON from script (fills advanced JSON / client state).
 */
export async function generateScenePlanWithLlm(
  _prev: SceneRenderLlmPlanState | null,
  formData: FormData,
): Promise<SceneRenderLlmPlanState> {
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
  const scriptText = String(formData.get("script_text") ?? "").trim();
  const modelRaw =
    String(formData.get("model") ?? "").trim() || DEFAULT_PACKAGING_DRAFT_MODEL_ID;

  if (!episodeId || !scriptText) return { error: ActionErrorCode.unexpected };

  const episode = await getStudioEpisodeForOrg(
    supabase,
    episodeId,
    auth.ctx.organizationId,
  );
  if (!episode) return { error: ActionErrorCode.studioEpisodeNotFound };

  const resolved = await resolveOrgLlmCredentialForDraftModel(
    supabase,
    auth.ctx.organizationId,
    modelRaw,
  );
  if (!resolved.ok) {
    return { error: ActionErrorCode.studioLlmNoProvider };
  }

  const brandGuide = brandGuideFromEpisode(episode);

  const out = await generateScenesWithLlm({
    cred: resolved.cred,
    scriptText,
    brandGuide,
    model: resolved.model,
  });

  if (!out.ok) {
    return { error: out.code === "llm_failed" ? ActionErrorCode.studioLlmRequestFailed : ActionErrorCode.studioLlmBadResponse };
  }

  return { ok: true, scenesJson: out.json };
}

/**
 * Full episode render with limited parallelism (single form submit / legacy).
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

  const runwayModel = parseRunwaySceneModelId(String(formData.get("runway_model") ?? ""));
  const visualSuffixRaw = String(formData.get("visual_prompt_suffix") ?? "");
  const visualPromptSuffix = visualSuffixRaw.trim() ? visualSuffixRaw : null;

  const scriptText = String(formData.get("script_text") ?? "").trim();
  const scenesJsonRaw = String(formData.get("scenes_json") ?? "").trim();
  const targetSceneRaw = String(formData.get("target_scene_count") ?? "").trim();
  const targetSceneCountParsed = targetSceneRaw
    ? Number.parseInt(targetSceneRaw, 10)
    : NaN;
  const targetSceneCount = Number.isFinite(targetSceneCountParsed)
    ? Math.min(12, Math.max(3, targetSceneCountParsed))
    : undefined;

  const resolved = await resolveEpisodeScenes({
    supabase,
    episodeId,
    organizationId: auth.ctx.organizationId,
    scriptText,
    scenesJsonRaw,
    targetSceneCount,
  });

  if (!resolved.ok) {
    return { error: resolved.error };
  }

  const budget = checkSceneDurationBudget(resolved.scenes);
  if (budget.block) {
    return { error: "studioSceneRenderBudgetExceeded" };
  }

  const scenes = resolved.scenes;
  const format = resolveEpisodeFormat(episode);
  const { ratio } = FORMAT_SPECS[format];
  const brandGuide = brandGuideFromEpisode(episode);

  const sceneResults = await mapWithConcurrency(
    scenes,
    PARALLEL_SCENES,
    async (scene) => {
      await deleteSceneClipsAtIndex(
        supabase,
        episodeId,
        auth.ctx.organizationId,
        scene.index,
      );
      return renderOneScene({
        supabase,
        runwayKey,
        episodeId,
        organizationId: auth.ctx.organizationId,
        scene,
        ratio,
        brandGuide,
        runwayModel,
        visualPromptSuffix,
      });
    },
  );

  void logAudit({
    organizationId: auth.ctx.organizationId,
    actorId: auth.ctx.userId,
    action: AuditAction.STUDIO_SCENE_RENDER,
    entityType: AuditEntityType.STUDIO_EPISODE,
    entityId: episodeId,
    metadata: {
      scene_count: scenes.length,
      format,
      ratio,
      parallel: PARALLEL_SCENES,
      max_total_seconds_budget: SCENE_BUDGET_MAX_TOTAL_SECONDS,
    },
  });

  revalidatePath(`/dashboard/productions/${episodeId}`);
  const allOk = sceneResults.every((r) => r.ok);
  return { ok: allOk, sceneResults };
}
