import { describe, expect, it } from "vitest";
import { scenePlanRowsFromPipelinePrefs } from "@/lib/studio-productions/episode-scene-plan-dto";

describe("scenePlanRowsFromPipelinePrefs", () => {
  it("returns null when sceneRender missing", () => {
    expect(scenePlanRowsFromPipelinePrefs({})).toBeNull();
  });

  it("parses rows from pipeline_prefs.sceneRender.scenesJson", () => {
    const j = {
      sceneRender: {
        scenesJson: JSON.stringify([
          {
            index: 0,
            narration: "n0",
            visual_prompt: "v0",
            duration_seconds: 4,
          },
        ]),
      },
    };
    const rows = scenePlanRowsFromPipelinePrefs(j);
    expect(rows).not.toBeNull();
    expect(rows).toHaveLength(1);
    expect(rows![0]).toMatchObject({
      index: 0,
      narration: "n0",
      visualPrompt: "v0",
      durationSeconds: 4,
    });
  });
});
