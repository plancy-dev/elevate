import { z } from "zod";
import type { Json } from "@/types/database.types";

const NumberFromUnknownSchema = z.preprocess((v) => {
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : v;
  }
  return v;
}, z.number().finite());

const StringArraySchema = z.array(z.string()).catch([]);

export const BaseArtifactMetadataSchema = z
  .object({
    source: z.string().optional(),
    provider: z.string().optional(),
    model: z.string().optional(),
    generated_at: z.string().optional(),
  })
  .passthrough();

export const LlmMetadataSchema = BaseArtifactMetadataSchema.extend({
  prompt_used: z.string().optional(),
  saved_at: z.string().optional(),
}).passthrough();

export const ImageGenMetadataSchema = BaseArtifactMetadataSchema.extend({
  scene_index: NumberFromUnknownSchema.optional(),
  prompt_used: z.string().optional(),
  width: NumberFromUnknownSchema.optional(),
  height: NumberFromUnknownSchema.optional(),
  seed: NumberFromUnknownSchema.optional(),
  storage_path: z.string().optional(),
  mime_type: z.string().optional(),
}).passthrough();

export const RunwayI2VMetadataSchema = BaseArtifactMetadataSchema.extend({
  source: z.string().optional(),
  runway_task_id: z.string().optional(),
  output_urls: StringArraySchema.optional(),
  scene_index: NumberFromUnknownSchema.optional(),
  target_duration_sec: NumberFromUnknownSchema.optional(),
  duration_seconds: NumberFromUnknownSchema.optional(),
  first_frame_url: z.string().optional(),
  last_frame_url: z.string().nullable().optional(),
}).passthrough();

export const ElevenLabsTtsMetadataSchema = BaseArtifactMetadataSchema.extend({
  mode: z.string().optional(),
  voice_id: z.string().optional(),
  voice_preset: z.string().optional(),
  model_id: z.string().optional(),
  language: z.string().optional(),
  chunk_count: NumberFromUnknownSchema.optional(),
  total_duration_ms: NumberFromUnknownSchema.optional(),
}).passthrough();

export const FfmpegAssemblyMetadataSchema = BaseArtifactMetadataSchema.extend({
  source: z.string().optional(),
  clip_count: NumberFromUnknownSchema.optional(),
  duration_seconds: NumberFromUnknownSchema.optional(),
  resolution: z.string().optional(),
  codec: z.string().optional(),
  content_storage_bucket: z.string().optional(),
  content_storage_path: z.string().optional(),
}).passthrough();

export const SubtitleMetadataSchema = BaseArtifactMetadataSchema.extend({
  format: z.string().optional(),
  segment_count: NumberFromUnknownSchema.optional(),
  model: z.string().optional(),
}).passthrough();

function toJsonObject(value: unknown): Record<string, Json> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, Json>;
}

function safeNormalize(
  schema: z.ZodTypeAny,
  raw: Json | null | undefined,
): Record<string, Json> | null {
  const obj = toJsonObject(raw);
  if (!obj) return null;
  const parsed = schema.safeParse(obj);
  if (!parsed.success) {
    return obj;
  }
  return parsed.data as Record<string, Json>;
}

export function parseArtifactMetadata(
  artifactRole: string,
  raw: Json | null | undefined,
): Record<string, Json> | null {
  switch (artifactRole) {
    case "hook":
    case "title":
    case "script":
    case "script_draft":
    case "prompt":
    case "settings":
    case "packaging_draft":
    case "social_captions":
    case "title_suggestion":
    case "compliance_note":
    case "reference_source":
      return safeNormalize(LlmMetadataSchema, raw);
    case "scene_keyframe_candidate":
    case "scene_keyframe_first":
    case "scene_keyframe_last":
    case "thumbnail":
      return safeNormalize(ImageGenMetadataSchema, raw);
    case "scene_clip":
      return safeNormalize(RunwayI2VMetadataSchema, raw);
    case "tts_audio":
      return safeNormalize(ElevenLabsTtsMetadataSchema, raw);
    case "assembled_video":
    case "render_output":
      return safeNormalize(FfmpegAssemblyMetadataSchema, raw);
    case "subtitle_srt":
    case "subtitle_vtt":
      return safeNormalize(SubtitleMetadataSchema, raw);
    default:
      return toJsonObject(raw);
  }
}

export function normalizeArtifactMetadataForWrite(
  artifactRole: string,
  raw: Json | null | undefined,
): Json | null {
  const normalized = parseArtifactMetadata(artifactRole, raw);
  return normalized ?? null;
}
