/**
 * Illustrative Runway **credits per second** by text-to-video model for UI estimates only.
 * Runway may change pricing; actual usage appears in the Runway dashboard — do not treat as billing truth.
 * Calibrate against current vendor docs, then update this table; keep UI disclaimer in sync with i18n (`messages/*.json`).
 */
import type { RunwayTextToVideoModelId } from "@/lib/studio-integrations/providers/runway/runway-scene-models";
import type { SceneRow } from "@/lib/studio-productions/scene-rows-json";

/** Rough relative cost for UX preview (credits × seconds ≈ order of magnitude). */
export const RUNWAY_SCENE_CREDITS_PER_SECOND_ESTIMATE: Record<RunwayTextToVideoModelId, number> =
  {
    "gen4.5": 5,
    "veo3.1": 8,
    "veo3.1_fast": 6,
    veo3: 7,
  };

/**
 * Sum of (per-second rate × scene duration) for all scenes — integer credits, rounded up per scene.
 */
export function estimateSceneRenderCredits(
  modelId: RunwayTextToVideoModelId,
  scenes: Pick<SceneRow, "durationSeconds">[],
): number {
  const rate = RUNWAY_SCENE_CREDITS_PER_SECOND_ESTIMATE[modelId];
  let total = 0;
  for (const s of scenes) {
    const sec = Math.max(0, Number(s.durationSeconds) || 0);
    total += Math.ceil(sec * rate);
  }
  return total;
}
