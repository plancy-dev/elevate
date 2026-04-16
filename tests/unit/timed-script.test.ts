import { describe, expect, it } from "vitest";
import {
  buildTimedScriptFromPlainScript,
  parseTimedScriptLlmJson,
  splitScriptIntoTimedBlocks,
} from "@/lib/studio-productions/timed-script";

describe("splitScriptIntoTimedBlocks", () => {
  it("splits on blank lines first", () => {
    const s = "A\n\nB\n\nC";
    expect(splitScriptIntoTimedBlocks(s)).toEqual(["A", "B", "C"]);
  });

  it("splits on single newlines when there are no blank lines (KO/JA paste)", () => {
    const s = "첫 문단입니다.\n둘째 문단입니다.\n셋째 문단입니다.";
    expect(splitScriptIntoTimedBlocks(s)).toEqual([
      "첫 문단입니다.",
      "둘째 문단입니다.",
      "셋째 문단입니다.",
    ]);
  });

  it("falls back to one block for a single line without sentence punctuation", () => {
    const s = "한줄로만쓴긴문장";
    expect(splitScriptIntoTimedBlocks(s)).toEqual(["한줄로만쓴긴문장"]);
  });
});

describe("buildTimedScriptFromPlainScript", () => {
  it("assigns cumulative timestamps per paragraph (single newlines)", () => {
    const script = "가\n나\n다";
    const out = buildTimedScriptFromPlainScript(script);
    const lines = out.split("\n\n");
    expect(lines).toHaveLength(3);
    expect(lines[0]).toMatch(/^\[00:00\]/);
    expect(lines[1]).toMatch(/^\[00:03\]/);
    expect(lines[2]).toMatch(/^\[00:06\]/);
  });

  it("includes multiple stamps for Latin sentences when one line", () => {
    const script = "First. Second! Third?";
    const out = buildTimedScriptFromPlainScript(script);
    expect(out.split("\n\n")).toHaveLength(3);
  });
});

describe("parseTimedScriptLlmJson", () => {
  it("parses segments JSON into [mm:ss] blocks", () => {
    const raw = JSON.stringify({
      segments: [
        { start_sec: 0, text: "Hello" },
        { start_sec: 15, text: "World" },
      ],
    });
    const out = parseTimedScriptLlmJson(raw);
    expect(out).toContain("[00:00] Hello");
    expect(out).toContain("[00:15] World");
  });

  it("returns null for invalid JSON", () => {
    expect(parseTimedScriptLlmJson("not json")).toBeNull();
  });
});
