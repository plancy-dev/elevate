import { describe, expect, it } from "vitest";
import { buildSceneImagePrompt } from "@/lib/studio-productions/scene-image-prompt";
import type { CharacterBible } from "@/lib/studio-productions/character-bible";

const richBible: CharacterBible = {
  name: "Aria Chen",
  age: 28,
  appearance: {
    hair: "shoulder-length black",
    eyes: "dark brown",
    skin: "warm beige",
    ethnicity: "East Asian",
  },
  wardrobe: "minimalist beige knit, dark jeans",
  style: "cinematic, natural lighting",
  color_palette: { primary: "#f4a89c", secondary: "#222", accent: "#ff6a00" },
  extras: { accessories: "silver thin-frame glasses" },
};

describe("buildSceneImagePrompt", () => {
  it("includes IDENTITY LOCK when bible is populated", () => {
    const prompt = buildSceneImagePrompt({
      bible: richBible,
      sceneDescription: "Aria sits at a monitor, watching an experiment",
      visualPrompt: "holographic particles drift upward",
      aspectRatio: "9:16",
      hasReferenceImage: false,
    });
    expect(prompt).toContain("IDENTITY LOCK");
    expect(prompt).toContain("Aria Chen");
    expect(prompt).toContain("silver thin-frame glasses");
    expect(prompt).toContain("target aspect ratio: 9:16");
  });

  it("omits IDENTITY LOCK when bible has no usable fields", () => {
    const prompt = buildSceneImagePrompt({
      bible: null,
      sceneDescription: "minimal scene",
      visualPrompt: "soft light",
      aspectRatio: "16:9",
      hasReferenceImage: false,
    });
    expect(prompt).not.toContain("IDENTITY LOCK");
  });

  it("adds a reference-image hint when hasReferenceImage is true", () => {
    const prompt = buildSceneImagePrompt({
      bible: richBible,
      sceneDescription: "s",
      visualPrompt: "v",
      aspectRatio: "1:1",
      hasReferenceImage: true,
    });
    expect(prompt).toContain("match the reference image above");
  });

  it("forbids on-image text in the STYLE RULES block", () => {
    const prompt = buildSceneImagePrompt({
      bible: null,
      sceneDescription: "s",
      visualPrompt: "v",
      aspectRatio: "9:16",
      hasReferenceImage: false,
    });
    expect(prompt).toContain("no on-image text");
    expect(prompt).toContain("no logos");
  });
});
