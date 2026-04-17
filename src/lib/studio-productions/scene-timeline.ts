import type { SceneRow } from "@/lib/studio-productions/scene-rows-json";

export type SceneWorldRange = {
  index: number;
  /** Cumulative start on the episode timeline (seconds). */
  worldStartSec: number;
  /** Scene duration D_i (seconds). */
  durationSec: number;
};

/**
 * Build per-scene world time ranges from ordered scene rows (same order as concat).
 */
export function buildSceneWorldRanges(rows: SceneRow[]): SceneWorldRange[] {
  const sorted = [...rows].sort((a, b) => a.index - b.index);
  let t = 0;
  const out: SceneWorldRange[] = [];
  for (const row of sorted) {
    const d = Math.max(0.1, row.durationSeconds);
    out.push({
      index: row.index,
      worldStartSec: t,
      durationSec: d,
    });
    t += d;
  }
  return out;
}
