import { describe, expect, it } from "vitest";
import {
  segmentsToWebVtt,
  segmentsToSrt,
} from "@/lib/studio-productions/subtitle-formatter";
import type { TtsSegment } from "@/lib/studio-productions/tts-chunked-pipeline";

const SEGMENTS: TtsSegment[] = [
  { index: 0, text: "Hello world", startMs: 0, endMs: 3000 },
  { index: 1, text: "Second paragraph here", startMs: 3300, endMs: 7500 },
];

describe("segmentsToWebVtt", () => {
  it("starts with WEBVTT header", () => {
    const vtt = segmentsToWebVtt(SEGMENTS);
    expect(vtt.startsWith("WEBVTT\n")).toBe(true);
  });

  it("uses dot separator for milliseconds (W3C spec)", () => {
    const vtt = segmentsToWebVtt(SEGMENTS);
    expect(vtt).toContain("00:00:00.000 --> 00:00:03.000");
    expect(vtt).toContain("00:00:03.300 --> 00:00:07.500");
  });

  it("contains cue text", () => {
    const vtt = segmentsToWebVtt(SEGMENTS);
    expect(vtt).toContain("Hello world");
    expect(vtt).toContain("Second paragraph here");
  });
});

describe("segmentsToSrt", () => {
  it("starts with sequence number 1", () => {
    const srt = segmentsToSrt(SEGMENTS);
    expect(srt.startsWith("1\n")).toBe(true);
  });

  it("uses comma separator for milliseconds (SRT convention)", () => {
    const srt = segmentsToSrt(SEGMENTS);
    expect(srt).toContain("00:00:00,000 --> 00:00:03,000");
    expect(srt).toContain("00:00:03,300 --> 00:00:07,500");
  });

  it("contains sequential indices", () => {
    const srt = segmentsToSrt(SEGMENTS);
    expect(srt).toContain("\n2\n");
  });
});
