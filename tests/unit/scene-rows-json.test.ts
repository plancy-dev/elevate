import { describe, expect, it } from "vitest";
import { parseSceneRows } from "@/lib/studio-productions/scene-rows-json";

describe("parseSceneRows", () => {
  it("parses valid array with snake_case duration", () => {
    const j = JSON.stringify([
      {
        index: 0,
        narration: "a",
        visual_prompt: "b",
        duration_seconds: 8,
      },
    ]);
    const rows = parseSceneRows(j);
    expect(rows).toHaveLength(1);
    expect(rows![0].durationSeconds).toBe(8);
  });

  it("returns null for invalid json", () => {
    expect(parseSceneRows("not json")).toBeNull();
  });
});
