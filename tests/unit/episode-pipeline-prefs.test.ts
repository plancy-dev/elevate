import { describe, expect, it } from "vitest";
import {
  draftWorkbenchPrefsFromPipelinePrefs,
  mergePipelinePrefsPatch,
  sceneRenderPrefsFromPipelinePrefs,
  ttsPrefsFromPipelinePrefs,
} from "@/lib/studio-productions/episode-pipeline-prefs";

describe("mergePipelinePrefsPatch", () => {
  it("merges nested objects without dropping sibling keys", () => {
    const base = {
      sceneRender: { scenesJson: "[]", planModelId: "a", targetSceneCount: "" },
      tts: { voicePreset: "female", language: "ko" },
    };
    const patch = { sceneRender: { scenesJson: "[1]" } };
    const out = mergePipelinePrefsPatch(base, patch) as Record<string, Record<string, string>>;
    expect(out.sceneRender.scenesJson).toBe("[1]");
    expect(out.sceneRender.planModelId).toBe("a");
    expect(out.tts.language).toBe("ko");
  });

  it("replaces arrays wholesale", () => {
    const base = { tags: ["a", "b"] };
    const patch = { tags: ["c"] };
    expect(mergePipelinePrefsPatch(base, patch)).toEqual({ tags: ["c"] });
  });
});

describe("sceneRenderPrefsFromPipelinePrefs", () => {
  it("parses sceneRender block", () => {
    const j = {
      sceneRender: {
        scenesJson: "[{}]",
        planModelId: "m1",
        targetSceneCount: "5",
      },
    };
    expect(sceneRenderPrefsFromPipelinePrefs(j)).toEqual({
      scenesJson: "[{}]",
      planModelId: "m1",
      targetSceneCount: "5",
      runwayModelId: "",
      visualPromptSuffix: "",
    });
  });
});

describe("draftWorkbenchPrefsFromPipelinePrefs", () => {
  it("parses draftWorkbench.stickyContext", () => {
    expect(
      draftWorkbenchPrefsFromPipelinePrefs({
        draftWorkbench: { stickyContext: "  hello  " },
      }),
    ).toEqual({ stickyContext: "  hello  " });
  });

  it("returns empty sticky when missing", () => {
    expect(draftWorkbenchPrefsFromPipelinePrefs({})).toEqual({ stickyContext: "" });
    expect(draftWorkbenchPrefsFromPipelinePrefs(null)).toEqual({ stickyContext: "" });
  });
});

describe("ttsPrefsFromPipelinePrefs", () => {
  it("fills defaults from saved tts and locale", () => {
    const j = {
      tts: {
        voicePreset: "custom",
        voiceId: "vid",
        stability: "0.4",
      },
    };
    const out = ttsPrefsFromPipelinePrefs(j, "en");
    expect(out.voicePreset).toBe("custom");
    expect(out.voiceId).toBe("vid");
    expect(out.stability).toBe("0.4");
    expect(out.language).toBe("en");
  });
});
