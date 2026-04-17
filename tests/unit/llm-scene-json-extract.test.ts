import { describe, expect, it } from "vitest";
import { extractJsonPayloadFromLlmOutput } from "@/lib/studio-productions/llm-scene-json-extract";

describe("extractJsonPayloadFromLlmOutput", () => {
  it("returns raw object when already clean JSON", () => {
    const j = '{"scenes":[{"narration":"a","visual_prompt":"b","duration":5}]}';
    expect(extractJsonPayloadFromLlmOutput(j)).toBe(j);
  });

  it("strips markdown json fences", () => {
    const inner =
      '{"scenes":[{"narration":"hello","visual_prompt":"sunset","duration_seconds":6}]}';
    const wrapped = `Here you go:\n\`\`\`json\n${inner}\n\`\`\`\n`;
    expect(extractJsonPayloadFromLlmOutput(wrapped)).toBe(inner);
  });

  it("finds JSON after preamble text", () => {
    const inner = '[{"narration":"x","visual_prompt":"y","duration":4}]';
    const t = `Sure! ${inner} hope this helps`;
    expect(extractJsonPayloadFromLlmOutput(t)).toBe(inner);
  });
});
