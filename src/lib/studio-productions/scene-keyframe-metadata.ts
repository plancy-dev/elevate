/**
 * `studio_production_artifacts.metadata` shape for scene keyframe artifacts
 * (ADR-009 §4).
 */
import type { Json } from "@/types/database.types";
import type { StudioImageProviderId } from "@/lib/studio-integrations/types";
import { isStudioImageProviderId } from "@/lib/studio-integrations/types";

export type SceneKeyframeMetadata = {
  scene_index: number;
  provider: StudioImageProviderId;
  model: string;
  prompt_used: string;
  reference_image_id?: string;
  watermark_free: boolean;
  storage_path: string;
  mime_type: string;
  width: number;
  height: number;
  seed?: number;
  generated_at: string;
};

export function serializeSceneKeyframeMetadata(
  meta: SceneKeyframeMetadata,
): Json {
  const json: Record<string, Json> = {
    scene_index: meta.scene_index,
    provider: meta.provider,
    model: meta.model,
    prompt_used: meta.prompt_used,
    watermark_free: meta.watermark_free,
    storage_path: meta.storage_path,
    mime_type: meta.mime_type,
    width: meta.width,
    height: meta.height,
    generated_at: meta.generated_at,
  };
  if (meta.reference_image_id) json.reference_image_id = meta.reference_image_id;
  if (meta.seed != null) json.seed = meta.seed;
  return json;
}

export function parseSceneKeyframeMetadata(
  raw: Json | null | undefined,
): SceneKeyframeMetadata | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const sceneIndex =
    typeof o.scene_index === "number" && Number.isFinite(o.scene_index)
      ? o.scene_index
      : null;
  const provider = isStudioImageProviderId(o.provider) ? o.provider : null;
  const model = typeof o.model === "string" ? o.model : null;
  const promptUsed = typeof o.prompt_used === "string" ? o.prompt_used : null;
  const storagePath = typeof o.storage_path === "string" ? o.storage_path : null;
  const mimeType = typeof o.mime_type === "string" ? o.mime_type : null;
  if (
    sceneIndex == null ||
    !provider ||
    !model ||
    promptUsed == null ||
    !storagePath ||
    !mimeType
  ) {
    return null;
  }

  const watermarkFree =
    typeof o.watermark_free === "boolean" ? o.watermark_free : false;
  const width = typeof o.width === "number" ? o.width : 0;
  const height = typeof o.height === "number" ? o.height : 0;
  const generatedAt =
    typeof o.generated_at === "string" ? o.generated_at : new Date().toISOString();

  const out: SceneKeyframeMetadata = {
    scene_index: sceneIndex,
    provider,
    model,
    prompt_used: promptUsed,
    watermark_free: watermarkFree,
    storage_path: storagePath,
    mime_type: mimeType,
    width,
    height,
    generated_at: generatedAt,
  };

  if (typeof o.reference_image_id === "string") {
    out.reference_image_id = o.reference_image_id;
  }
  if (typeof o.seed === "number" && Number.isFinite(o.seed)) {
    out.seed = o.seed;
  }

  return out;
}
