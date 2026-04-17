import { describe, expect, it } from "vitest";
import { parseSrt, sliceSrtToLocalWindow } from "@/lib/studio-productions/srt-slice";

describe("srt-slice", () => {
  const sample = `1
00:00:00,000 --> 00:00:02,000
Line one

2
00:00:05,000 --> 00:00:08,000
Line two

3
00:00:10,000 --> 00:00:12,000
Line three
`;

  it("parseSrt reads cues", () => {
    const cues = parseSrt(sample);
    expect(cues).toHaveLength(3);
    expect(cues[0]!.startSec).toBe(0);
    expect(cues[0]!.endSec).toBe(2);
  });

  it("sliceSrtToLocalWindow extracts and reindexes", () => {
    const local = sliceSrtToLocalWindow(sample, 5, 9);
    expect(local).toContain("00:00:00,000 --> 00:00:03,000");
    expect(local).toContain("Line two");
    expect(local).not.toContain("Line one");
  });

  it("sliceSrtToLocalWindow returns empty when no overlap", () => {
    expect(sliceSrtToLocalWindow(sample, 20, 25).trim()).toBe("");
  });
});
