import { describe, expect, it } from "vitest";
import { buildSceneI2VPrompt } from "@/lib/studio-productions/scene-i2v-prompt";

describe("buildSceneI2VPrompt", () => {
  it("stays within Runway's 80-word sweet spot", () => {
    const longScene = Array.from({ length: 30 })
      .map(() => "Her expression shifts subtly while the holographic particles drift")
      .join(" ");
    const prompt = buildSceneI2VPrompt({
      bible: null,
      sceneDescription: longScene,
      visualPrompt: longScene,
      modelSupportsLastFrame: true,
    });
    const wordCount = prompt.split(/\s+/).filter(Boolean).length;
    expect(wordCount).toBeLessThanOrEqual(80);
  });

  it("merges end-state hint when the model cannot accept a Last Frame", () => {
    const prompt = buildSceneI2VPrompt({
      bible: null,
      sceneDescription: "Aria watches her screen",
      visualPrompt: "slow dolly in",
      endStateHint: "she leans forward and smiles",
      modelSupportsLastFrame: false,
    });
    expect(prompt.toLowerCase()).toContain("end state");
    expect(prompt).toContain("leans forward");
  });

  it("ignores end-state hint when the model supports Last Frame", () => {
    const prompt = buildSceneI2VPrompt({
      bible: null,
      sceneDescription: "Aria watches her screen",
      visualPrompt: "slow dolly in",
      endStateHint: "she leans forward",
      modelSupportsLastFrame: true,
    });
    expect(prompt.toLowerCase()).not.toContain("end state");
  });

  it("mentions the character identity when a bible is passed", () => {
    const prompt = buildSceneI2VPrompt({
      bible: {
        name: "Aria Chen",
        wardrobe: "beige knit",
        style: "cinematic",
      },
      sceneDescription: "a",
      visualPrompt: "b",
      modelSupportsLastFrame: true,
    });
    expect(prompt).toContain("Aria Chen");
  });

  it("never returns empty", () => {
    const prompt = buildSceneI2VPrompt({
      bible: null,
      sceneDescription: "",
      visualPrompt: "",
      modelSupportsLastFrame: true,
    });
    expect(prompt.length).toBeGreaterThan(0);
  });
});
