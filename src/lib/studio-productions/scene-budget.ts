import "server-only";

import {
  SCENE_BUDGET_MAX_TOTAL_SECONDS,
  SCENE_BUDGET_WARN_TOTAL_SECONDS,
} from "@/lib/studio-productions/scene-budget-constants";
import type { SceneDefinition } from "@/lib/studio-productions/scene-splitter";

export {
  SCENE_BUDGET_MAX_TOTAL_SECONDS,
  SCENE_BUDGET_WARN_TOTAL_SECONDS,
} from "@/lib/studio-productions/scene-budget-constants";

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
