import { describe, expect, it } from "vitest";
import {
  SCENE_BUDGET_MAX_TOTAL_SECONDS,
  SCENE_BUDGET_WARN_TOTAL_SECONDS,
} from "@/lib/studio-productions/scene-budget-constants";

describe("scene-budget-constants", () => {
  it("matches server guard thresholds (see scene-budget.ts)", () => {
    expect(SCENE_BUDGET_WARN_TOTAL_SECONDS).toBe(90);
    expect(SCENE_BUDGET_MAX_TOTAL_SECONDS).toBe(180);
  });
});
