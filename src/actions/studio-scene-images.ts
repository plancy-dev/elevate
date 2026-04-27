"use server";

import { revalidatePath } from "next/cache";
import { getOrgMemberContext } from "@/lib/auth/require-org-editor";
import { ActionErrorCode } from "@/lib/i18n/action-error-codes";
import { createClient } from "@/lib/supabase/server";
import { getStudioEpisodeForOrg } from "@/lib/data/studio-productions";
import { readStudioIntegrationsServerEnabled } from "@/lib/studio-integrations/feature";
import { isStudioIntegrationsEncryptionConfigured } from "@/lib/studio-integrations/crypto";
import { getOrgProviderApiKey } from "@/lib/studio-integrations/org-provider-secret";
import { generateSceneImages } from "@/lib/studio-integrations/providers/images/registry";
import type {
  ImageAspectRatio,
  ImageGenParams,
} from "@/lib/studio-integrations/providers/images/types";
import {
  IMAGE_PROVIDER_META,
} from "@/lib/studio-integrations/providers/images/types";
import {
  isStudioImageProviderId,
  type StudioImageProviderId,
} from "@/lib/studio-integrations/types";
import { parseCharacterBible } from "@/lib/studio-productions/character-bible";
import { buildSceneImagePrompt } from "@/lib/studio-productions/scene-image-prompt";
import {
  parseSceneKeyframeMetadata,
  serializeSceneKeyframeMetadata,
  type SceneKeyframeMetadata,
} from "@/lib/studio-productions/scene-keyframe-metadata";
import {
  deleteSceneImageFromStorage,
  uploadSceneImageToContentStorage,
} from "@/lib/studio-productions/scene-image-storage";
import { scenePlanRowsFromPipelinePrefs } from "@/lib/studio-productions/episode-scene-plan-dto";
import { resolveEpisodeFormat, FORMAT_SPECS } from "@/lib/studio-productions/episode-format";
import { isSceneKeyframeRole } from "@/lib/studio-productions/artifact-roles";
import { STUDIO_CONTENT_TEXT_MAX } from "@/lib/studio-productions/constants";
import { normalizeArtifactMetadataForWrite } from "@/lib/studio-productions/artifact-metadata-schemas";
import { logAudit } from "@/lib/audit/log";
import { AuditAction, AuditEntityType } from "@/lib/audit/constants";
import type { Database, Json } from "@/types/database.types";

export type SceneImageActionState = {
  ok?: boolean;
  error?: string;
  /** Number of images successfully generated (when ok). */
  generatedCount?: number;
  /** Ids of newly inserted candidate artifacts. */
  artifactIds?: string[];
} | null;

function ratioForEpisode(episode: Parameters<typeof resolveEpisodeFormat>[0]): ImageAspectRatio {
  // Use FORMAT_SPECS to derive the canonical aspect ratio for the episode's
  // format. Shorts default to 9:16 which is the Phase 1 UX expectation.
  const format = resolveEpisodeFormat(episode);
  const spec = FORMAT_SPECS[format];
  if (spec.ratio === "720:1280") return "9:16";
  if (spec.ratio === "1280:720") return "16:9";
  return "9:16";
}

async function loadEpisodeProject(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  episodeId: string,
) {
  const episode = await getStudioEpisodeForOrg(supabase, episodeId, organizationId);
  if (!episode) return null;
  let project: Database["public"]["Tables"]["studio_projects"]["Row"] | null =
    null;
  if (episode.project_id) {
    const { data } = await supabase
      .from("studio_projects")
      .select("*")
      .eq("id", episode.project_id)
      .eq("organization_id", organizationId)
      .maybeSingle();
    project = data ?? null;
  }
  return { episode, project };
}

function loadSceneFromPipelinePrefs(
  episode: { pipeline_prefs?: unknown } | null | undefined,
  sceneIndex: number,
): { narration: string; visualPrompt: string } | null {
  const prefs = episode?.pipeline_prefs;
  const parsed = scenePlanRowsFromPipelinePrefs(
    (prefs ?? null) as Parameters<typeof scenePlanRowsFromPipelinePrefs>[0],
  );
  if (!parsed) return null;
  const match = parsed.find((r) => r.index === sceneIndex);
  if (!match) return null;
  return { narration: match.narration, visualPrompt: match.visualPrompt };
}

async function nextSortOrder(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  episodeId: string,
): Promise<number> {
  const { data } = await supabase
    .from("studio_production_artifacts")
    .select("sort_order")
    .eq("episode_id", episodeId)
    .eq("organization_id", organizationId)
    .order("sort_order", { ascending: false })
    .limit(1);
  return (data?.[0]?.sort_order ?? -1) + 1;
}

/**
 * Generate N candidate scene keyframe images for a single scene index, using
 * the chosen image provider. Each returned image is uploaded to Storage and
 * persisted as a `scene_keyframe_candidate` artifact.
 */
export async function generateSceneKeyframes(
  _prev: SceneImageActionState,
  formData: FormData,
): Promise<SceneImageActionState> {
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
  const providerRaw = String(formData.get("provider") ?? "").trim();
  const countRaw = String(formData.get("count") ?? "4").trim();

  const sceneIndex = Number(sceneIndexRaw);
  if (!episodeId || !Number.isFinite(sceneIndex) || sceneIndex < 0) {
    return { error: ActionErrorCode.unexpected };
  }
  if (!isStudioImageProviderId(providerRaw)) {
    return { error: ActionErrorCode.studioSceneImageProviderInvalid };
  }
  const provider: StudioImageProviderId = providerRaw;
  const count = Math.max(1, Math.min(Number(countRaw) || 4, 4));

  const ctx = await loadEpisodeProject(
    supabase,
    auth.ctx.organizationId,
    episodeId,
  );
  if (!ctx) return { error: ActionErrorCode.studioEpisodeNotFound };

  const apiKey = await getOrgProviderApiKey(
    supabase,
    auth.ctx.organizationId,
    provider,
  );
  if (!apiKey) {
    return { error: ActionErrorCode.studioSceneImageNoProviderKey };
  }

  const scene = loadSceneFromPipelinePrefs(ctx.episode, sceneIndex);
  if (!scene) {
    return { error: ActionErrorCode.studioSceneRenderScenesInvalid };
  }

  const bible = ctx.project
    ? parseCharacterBible(ctx.project.character_bible)
    : null;
  const referenceImageUrl =
    ctx.project?.character_reference_image_url ?? undefined;
  const aspectRatio = ratioForEpisode(ctx.episode);

  const prompt = buildSceneImagePrompt({
    bible,
    sceneDescription: scene.narration,
    visualPrompt: scene.visualPrompt,
    aspectRatio,
    hasReferenceImage:
      !!referenceImageUrl && IMAGE_PROVIDER_META[provider].supportsReference,
  });

  const params: ImageGenParams = {
    prompt,
    count,
    aspectRatio,
    referenceImageUrl:
      IMAGE_PROVIDER_META[provider].supportsReference
        ? referenceImageUrl
        : undefined,
  };

  const result = await generateSceneImages(provider, apiKey, params);
  if (!result.ok) {
    switch (result.code) {
      case "image_provider_missing_key":
        return { error: ActionErrorCode.studioSceneImageNoProviderKey };
      case "image_provider_safety_blocked":
        return { error: ActionErrorCode.studioSceneImageSafetyBlocked };
      case "image_provider_rate_limited":
        return { error: ActionErrorCode.studioSceneImageRateLimited };
      case "image_provider_timeout":
        return { error: ActionErrorCode.studioSceneImageTimeout };
      default:
        return { error: ActionErrorCode.studioSceneImageProviderError };
    }
  }

  const insertedIds: string[] = [];
  let sort = await nextSortOrder(
    supabase,
    auth.ctx.organizationId,
    episodeId,
  );
  const generatedAt = new Date().toISOString();
  const promptPersisted = prompt.slice(0, STUDIO_CONTENT_TEXT_MAX);

  for (const image of result.images) {
    const upload = await uploadSceneImageToContentStorage({
      organizationId: auth.ctx.organizationId,
      episodeId,
      sceneIndex,
      body: image.bytes,
      contentType: image.mimeType,
    });

    const meta: SceneKeyframeMetadata = {
      scene_index: sceneIndex,
      provider,
      model: result.model,
      prompt_used: promptPersisted,
      watermark_free: image.watermarkFree,
      storage_path: upload.storagePath,
      mime_type: image.mimeType,
      width: image.width || 0,
      height: image.height || 0,
      generated_at: generatedAt,
    };
    if (image.seed != null) meta.seed = image.seed;

    const { data, error } = await supabase
      .from("studio_production_artifacts")
      .insert({
        organization_id: auth.ctx.organizationId,
        episode_id: episodeId,
        artifact_role: "scene_keyframe_candidate",
        tool_platform: provider,
        content_text: `scene ${sceneIndex}: keyframe candidate`,
        external_url: upload.publicUrl,
        metadata: normalizeArtifactMetadataForWrite(
          "scene_keyframe_candidate",
          serializeSceneKeyframeMetadata(meta) as Json,
        ),
        sort_order: sort,
      })
      .select("id")
      .single();

    if (error) continue;
    if (data?.id) insertedIds.push(data.id);
    sort += 1;
  }

  if (insertedIds.length === 0) {
    return { error: ActionErrorCode.studioSceneImageProviderError };
  }

  void logAudit({
    organizationId: auth.ctx.organizationId,
    actorId: auth.ctx.userId,
    action: AuditAction.STUDIO_SCENE_IMAGE_GENERATE,
    entityType: AuditEntityType.STUDIO_EPISODE,
    entityId: episodeId,
    metadata: {
      scene_index: sceneIndex,
      provider,
      model: result.model,
      count: insertedIds.length,
    },
  });

  revalidatePath(`/dashboard/productions/${episodeId}`);
  return {
    ok: true,
    generatedCount: insertedIds.length,
    artifactIds: insertedIds,
  };
}

/**
 * Promote a candidate keyframe artifact to First/Last Frame for its scene.
 * The previous slot holder (if any) is demoted back to `scene_keyframe_candidate`
 * so at most one artifact holds each slot per scene.
 */
export async function setSceneKeyframeSlot(
  _prev: SceneImageActionState,
  formData: FormData,
): Promise<SceneImageActionState> {
  void _prev;

  const supabase = await createClient();
  const auth = await getOrgMemberContext(supabase);
  if (!auth.ok) return { error: auth.error };

  const artifactId = String(formData.get("artifact_id") ?? "").trim();
  const slot = String(formData.get("slot") ?? "").trim();
  if (!artifactId || (slot !== "first" && slot !== "last")) {
    return { error: ActionErrorCode.unexpected };
  }

  const { data: artifact } = await supabase
    .from("studio_production_artifacts")
    .select("id, episode_id, metadata, artifact_role")
    .eq("id", artifactId)
    .eq("organization_id", auth.ctx.organizationId)
    .maybeSingle();
  if (!artifact) {
    return { error: ActionErrorCode.studioSceneImageArtifactNotFound };
  }

  const meta = parseSceneKeyframeMetadata(artifact.metadata);
  if (!meta) {
    return { error: ActionErrorCode.studioSceneImageArtifactNotFound };
  }
  if (!meta.watermark_free) {
    return { error: ActionErrorCode.studioSceneImageWatermarkedRejected };
  }

  const targetRole =
    slot === "first" ? "scene_keyframe_first" : "scene_keyframe_last";

  // Demote any current holder of the slot for this scene back to candidate.
  const { data: currentHolders } = await supabase
    .from("studio_production_artifacts")
    .select("id, metadata")
    .eq("episode_id", artifact.episode_id)
    .eq("organization_id", auth.ctx.organizationId)
    .eq("artifact_role", targetRole);

  const demoteIds: string[] = [];
  for (const holder of currentHolders ?? []) {
    if (holder.id === artifactId) continue;
    const m = parseSceneKeyframeMetadata(holder.metadata);
    if (m && m.scene_index === meta.scene_index) {
      demoteIds.push(holder.id);
    }
  }

  if (demoteIds.length > 0) {
    await supabase
      .from("studio_production_artifacts")
      .update({ artifact_role: "scene_keyframe_candidate" })
      .in("id", demoteIds)
      .eq("organization_id", auth.ctx.organizationId);
  }

  const { error } = await supabase
    .from("studio_production_artifacts")
    .update({ artifact_role: targetRole })
    .eq("id", artifactId)
    .eq("organization_id", auth.ctx.organizationId);
  if (error) {
    return { error: ActionErrorCode.dbError };
  }

  void logAudit({
    organizationId: auth.ctx.organizationId,
    actorId: auth.ctx.userId,
    action: AuditAction.STUDIO_SCENE_IMAGE_PROMOTE,
    entityType: AuditEntityType.STUDIO_ARTIFACT,
    entityId: artifactId,
    metadata: { slot, scene_index: meta.scene_index },
  });

  revalidatePath(`/dashboard/productions/${artifact.episode_id}`);
  return { ok: true };
}

/**
 * Clear a First/Last slot by demoting the artifact back to candidate.
 */
export async function clearSceneKeyframeSlot(
  _prev: SceneImageActionState,
  formData: FormData,
): Promise<SceneImageActionState> {
  void _prev;

  const supabase = await createClient();
  const auth = await getOrgMemberContext(supabase);
  if (!auth.ok) return { error: auth.error };

  const artifactId = String(formData.get("artifact_id") ?? "").trim();
  if (!artifactId) return { error: ActionErrorCode.unexpected };

  const { data: artifact } = await supabase
    .from("studio_production_artifacts")
    .select("id, episode_id, artifact_role")
    .eq("id", artifactId)
    .eq("organization_id", auth.ctx.organizationId)
    .maybeSingle();
  if (!artifact) {
    return { error: ActionErrorCode.studioSceneImageArtifactNotFound };
  }
  if (!isSceneKeyframeRole(artifact.artifact_role)) {
    return { error: ActionErrorCode.studioSceneImageArtifactNotFound };
  }

  const { error } = await supabase
    .from("studio_production_artifacts")
    .update({ artifact_role: "scene_keyframe_candidate" })
    .eq("id", artifactId)
    .eq("organization_id", auth.ctx.organizationId);
  if (error) return { error: ActionErrorCode.dbError };

  revalidatePath(`/dashboard/productions/${artifact.episode_id}`);
  return { ok: true };
}

/**
 * Delete a scene keyframe artifact and its Storage object.
 */
export async function deleteSceneKeyframe(
  _prev: SceneImageActionState,
  formData: FormData,
): Promise<SceneImageActionState> {
  void _prev;

  const supabase = await createClient();
  const auth = await getOrgMemberContext(supabase);
  if (!auth.ok) return { error: auth.error };

  const artifactId = String(formData.get("artifact_id") ?? "").trim();
  if (!artifactId) return { error: ActionErrorCode.unexpected };

  const { data: artifact } = await supabase
    .from("studio_production_artifacts")
    .select("id, episode_id, metadata, artifact_role")
    .eq("id", artifactId)
    .eq("organization_id", auth.ctx.organizationId)
    .maybeSingle();
  if (!artifact) {
    return { error: ActionErrorCode.studioSceneImageArtifactNotFound };
  }

  const meta = parseSceneKeyframeMetadata(artifact.metadata);
  if (meta?.storage_path) {
    try {
      await deleteSceneImageFromStorage(meta.storage_path);
    } catch {
      /* best effort */
    }
  }

  const { error } = await supabase
    .from("studio_production_artifacts")
    .delete()
    .eq("id", artifactId)
    .eq("organization_id", auth.ctx.organizationId);
  if (error) return { error: ActionErrorCode.dbError };

  void logAudit({
    organizationId: auth.ctx.organizationId,
    actorId: auth.ctx.userId,
    action: AuditAction.STUDIO_SCENE_IMAGE_DELETE,
    entityType: AuditEntityType.STUDIO_ARTIFACT,
    entityId: artifactId,
    metadata: meta ? { scene_index: meta.scene_index } : {},
  });

  revalidatePath(`/dashboard/productions/${artifact.episode_id}`);
  return { ok: true };
}
