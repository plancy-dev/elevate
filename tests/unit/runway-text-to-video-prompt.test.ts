import { describe, expect, it } from "vitest";
import { slicePromptUtf16 } from "@/lib/studio-integrations/providers/runway/runway-text-to-video";

describe("slicePromptUtf16", () => {
  it("truncates to max code units using string iteration", () => {
    const s = "a".repeat(1005);
    expect(slicePromptUtf16(s, 1000).length).toBe(1000);
  });

  it("preserves emoji as single units where spread iteration does", () => {
    const s = "😀".repeat(600);
    const out = slicePromptUtf16(s, 1000);
    expect([...out].length).toBeLessThanOrEqual(1000);
  });
});
