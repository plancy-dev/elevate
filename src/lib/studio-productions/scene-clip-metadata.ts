import type { Json } from "@/types/database.types";

/** `studio_production_artifacts.metadata` for `artifact_role: scene_clip` (Runway + user upload). */
export type SceneClipSource = "runway" | "upload";

export type SceneClipMetadata = {
  scene_index: number;
  source: SceneClipSource;
  /** Must match scene plan JSON duration for this index (seconds). */
  target_duration_sec: number;
  /** Upload only: start offset into source video (seconds). Default 0. */
  trim_start_sec?: number;
  /** Upload only: if source is shorter than target, loop to fill. Default true. */
  loop?: boolean;
};

export function isSceneClipSource(v: unknown): v is SceneClipSource {
  return v === "runway" || v === "upload";
}

/** Narrow Json metadata from DB into a typed object; fills defaults for upload rows. */
export function parseSceneClipMetadata(
  raw: Json | null | undefined,
  fallbackIndex: number,
): SceneClipMetadata | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const sceneIndex =
    typeof o.scene_index === "number" && Number.isFinite(o.scene_index)
      ? o.scene_index
      : fallbackIndex;
  const source = isSceneClipSource(o.source) ? o.source : "runway";
  const target =
    typeof o.target_duration_sec === "number" && Number.isFinite(o.target_duration_sec)
      ? o.target_duration_sec
      : typeof o.duration_seconds === "number" && Number.isFinite(o.duration_seconds)
        ? o.duration_seconds
        : null;
  if (target == null || target <= 0) return null;
  const trim =
    typeof o.trim_start_sec === "number" && Number.isFinite(o.trim_start_sec)
      ? Math.max(0, o.trim_start_sec)
      : undefined;
  const loop = typeof o.loop === "boolean" ? o.loop : undefined;
  const meta: SceneClipMetadata = {
    scene_index: sceneIndex,
    source,
    target_duration_sec: target,
  };
  if (trim != null) meta.trim_start_sec = trim;
  if (loop != null) meta.loop = loop;
  return meta;
}
