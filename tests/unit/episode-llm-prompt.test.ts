import { describe, expect, it } from "vitest";
import {
  buildDraftPrompt,
  hasNonEmptyDraftText,
} from "@/lib/studio-productions/episode-llm";

describe("hasNonEmptyDraftText", () => {
  it("is false for undefined or all-empty fields", () => {
    expect(hasNonEmptyDraftText(undefined)).toBe(false);
    expect(
      hasNonEmptyDraftText({ hook: "", title: "  ", script_draft: "\n" }),
    ).toBe(false);
  });

  it("is true when any field has content", () => {
    expect(
      hasNonEmptyDraftText({ hook: "a", title: "", script_draft: "" }),
    ).toBe(true);
  });
});

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

  it("develop mode includes current draft JSON when provided", () => {
    const prompt = buildDraftPrompt({
      ...base,
      generateMode: "develop",
      currentDraft: {
        hook: "H",
        title: "T",
        script_draft: "S",
      },
    });
    expect(prompt).toContain("Generation mode: DEVELOP");
    expect(prompt).toContain("Current on-editor draft");
    expect(prompt).toContain('"hook":"H"');
  });

  it("includes template bias block when templateBias is non-empty", () => {
    const prompt = buildDraftPrompt({
      ...base,
      templateBias: "Custom bias line for tests.",
    });
    expect(prompt).toContain("Style and structure bias for this generation");
    expect(prompt).toContain("Custom bias line for tests.");
  });

  it("fresh mode omits current draft and adds staleness instructions", () => {
    const prompt = buildDraftPrompt({
      ...base,
      generateMode: "fresh",
      userBriefing: "Soldiers dancing; no office theme.",
      currentDraft: {
        hook: "office",
        title: "office",
        script_draft: "office",
      },
    });
    expect(prompt).toContain("Generation mode: FRESH");
    expect(prompt).not.toContain("Current on-editor draft");
    expect(prompt).toContain("Soldiers dancing");
    expect(prompt).toContain("Reminder (fresh mode)");
  });
});
