import { describe, expect, it } from "vitest";
import { buildDraftPrompt } from "@/lib/studio-productions/episode-llm";

describe("buildDraftPrompt", () => {
  const base = {
    episodeTitle: "Test",
    notes: "",
    nicheName: null as string | null,
    formatName: null as string | null,
    channelLabel: null as string | null,
    channelPlatform: null as string | null,
    channelMetadata: {},
    distributionLabel: "youtube_shorts",
  };

  it("omits briefing block when userBriefing is empty or whitespace", () => {
    const without = buildDraftPrompt({ ...base });
    expect(without).not.toContain("Additional direction for this generation");
    const whitespace = buildDraftPrompt({ ...base, userBriefing: "   \n  " });
    expect(whitespace).not.toContain("Additional direction for this generation");
  });

  it("includes briefing block when userBriefing has content", () => {
    const prompt = buildDraftPrompt({
      ...base,
      userBriefing: "Focus on Gen Z humor; avoid corporate jargon.",
    });
    expect(prompt).toContain("Additional direction for this generation");
    expect(prompt).toContain("Focus on Gen Z humor; avoid corporate jargon.");
  });

  it("warns that URLs cannot be fetched (no invented video-specific content)", () => {
    const prompt = buildDraftPrompt({ ...base });
    expect(prompt).toContain("do not have internet access");
    expect(prompt).toContain("YouTube");
  });
});
