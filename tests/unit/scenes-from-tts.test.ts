import { describe, expect, it } from "vitest";
import {
  buildScenesFromTtsTimings,
  parseTtsSegmentTimings,
} from "@/lib/studio-productions/scenes-from-tts";

describe("parseTtsSegmentTimings", () => {
  it("parses ElevenLabs-style rows { s, e }", () => {
    const meta = {
      segments: [
        { i: 0, t: "a", s: 0, e: 5000 },
        { i: 1, t: "b", s: 5000, e: 10000 },
      ],
    };
    expect(parseTtsSegmentTimings(meta)).toEqual([
      { startMs: 0, endMs: 5000 },
      { startMs: 5000, endMs: 10000 },
    ]);
  });

  it("returns null for missing segments", () => {
    expect(parseTtsSegmentTimings(null)).toBeNull();
    expect(parseTtsSegmentTimings({})).toBeNull();
  });
});

describe("buildScenesFromTtsTimings", () => {
  it("aligns scene durationSeconds with segment wall time (Runway max 10s)", () => {
    const script = "A\n\nB\n\nC";
    const timings = [
      { startMs: 0, endMs: 5000 },
      { startMs: 5000, endMs: 10000 },
      { startMs: 10000, endMs: 49000 },
    ];
    const scenes = buildScenesFromTtsTimings(script, timings);
    expect(scenes).not.toBeNull();
    expect(scenes!.map((s) => s.durationSeconds)).toEqual([5, 5, 10]);
  });
});
