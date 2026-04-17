import "server-only";

import type { SceneDefinition } from "@/lib/studio-productions/scene-splitter";

/** Soft warning when total planned Runway seconds exceed this (gen4.5 per-clip cap applies separately). */
export const SCENE_BUDGET_WARN_TOTAL_SECONDS = 90;

/** Hard error when sum of scene durations exceeds this (abuse / cost guard). */
export const SCENE_BUDGET_MAX_TOTAL_SECONDS = 180;

export function sumSceneDurations(scenes: SceneDefinition[]): number {
  return scenes.reduce((s, x) => s + x.durationSeconds, 0);
}

export type SceneBudgetCheck = {
  totalSeconds: number;
  warn?: "overSoftBudget";
  block?: "overHardBudget";
};

export function checkSceneDurationBudget(scenes: SceneDefinition[]): SceneBudgetCheck {
  const totalSeconds = sumSceneDurations(scenes);
  if (totalSeconds > SCENE_BUDGET_MAX_TOTAL_SECONDS) {
    return { totalSeconds, block: "overHardBudget" };
  }
  if (totalSeconds > SCENE_BUDGET_WARN_TOTAL_SECONDS) {
    return { totalSeconds, warn: "overSoftBudget" };
  }
  return { totalSeconds };
}
