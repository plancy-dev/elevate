/**
 * Runway text-to-video model ids (shared client + server).
 */
export const RUNWAY_TEXT_TO_VIDEO_MODEL_IDS = [
  "gen4.5",
  "veo3.1",
  "veo3.1_fast",
  "veo3",
] as const;

export type RunwayTextToVideoModelId = (typeof RUNWAY_TEXT_TO_VIDEO_MODEL_IDS)[number];

export const DEFAULT_RUNWAY_SCENE_MODEL: RunwayTextToVideoModelId = "gen4.5";

export function parseRunwaySceneModelId(raw: string | undefined | null): RunwayTextToVideoModelId {
  const s = String(raw ?? "").trim();
  for (const id of RUNWAY_TEXT_TO_VIDEO_MODEL_IDS) {
    if (s === id) return id;
  }
  return DEFAULT_RUNWAY_SCENE_MODEL;
}
