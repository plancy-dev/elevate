import { describe, expect, it } from "vitest";
import {
  estimateSceneRenderCredits,
  RUNWAY_SCENE_CREDITS_PER_SECOND_ESTIMATE,
} from "@/lib/studio-integrations/providers/runway/runway-scene-credits-estimate";

describe("estimateSceneRenderCredits", () => {
  it("sums ceil(duration * rate) per scene for gen4.5", () => {
    const rate = RUNWAY_SCENE_CREDITS_PER_SECOND_ESTIMATE["gen4.5"];
    const scenes = [{ durationSeconds: 4 }, { durationSeconds: 6 }];
    const expected = Math.ceil(4 * rate) + Math.ceil(6 * rate);
    expect(estimateSceneRenderCredits("gen4.5", scenes)).toBe(expected);
  });

  it("returns 0 for empty scenes", () => {
    expect(estimateSceneRenderCredits("veo3.1", [])).toBe(0);
  });

  it("treats invalid duration as 0", () => {
    expect(estimateSceneRenderCredits("veo3", [{ durationSeconds: NaN }])).toBe(0);
  });
});
