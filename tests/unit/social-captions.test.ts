import { describe, expect, it } from "vitest";
import {
  buildSocialCaptionUserMessage,
  clampCaption,
  parseSocialCaptions,
  renderPlatformCaption,
} from "@/lib/studio-productions/social-captions";

describe("buildSocialCaptionUserMessage", () => {
  it("includes all platform rules and required JSON shape", () => {
    const msg = buildSocialCaptionUserMessage({
      topic: "Runway vs Sora",
      script: "Short script content",
    });
    expect(msg).toContain("JSON");
    expect(msg).toContain("instagram rules");
    expect(msg).toContain("tiktok rules");
    expect(msg).toContain("youtube rules");
    expect(msg).toContain("Runway vs Sora");
  });

  it("inlines optional hook / brand voice / locale when provided", () => {
    const msg = buildSocialCaptionUserMessage({
      topic: "Topic",
      script: "s",
      hook: "Watch this",
      brandVoice: "calm educator",
      localeHint: "en",
      workingTitle: "WT",
    });
    expect(msg).toContain("hook: Watch this");
    expect(msg).toContain("brand_voice: calm educator");
    expect(msg).toContain("locale_hint: en");
    expect(msg).toContain("working_title: WT");
  });

  it("truncates script to 8000 chars", () => {
    const longScript = "z".repeat(20000);
    const msg = buildSocialCaptionUserMessage({ topic: "t", script: longScript });
    // Ensure the inlined script block is clamped to 8000 characters. We use
    // 'z' to avoid collision with other letters in the template copy.
    const match = msg.match(/z+/);
    expect(match).not.toBeNull();
    expect(match![0].length).toBe(8000);
  });
});

describe("parseSocialCaptions", () => {
  it("accepts the exact JSON shape", () => {
    const raw = JSON.stringify({
      instagram: "IG body",
      tiktok: "TT body",
      youtube: { title: "Title", description: "Desc" },
    });
    const parsed = parseSocialCaptions(raw);
    expect(parsed).toEqual({
      instagram: "IG body",
      tiktok: "TT body",
      youtube: { title: "Title", description: "Desc" },
    });
  });

  it("tolerates leading/trailing prose around the JSON", () => {
    const raw = `Here you go:\n{"instagram":"a","tiktok":"b","youtube":{"title":"t","description":"d"}}\nThanks!`;
    const parsed = parseSocialCaptions(raw);
    expect(parsed?.instagram).toBe("a");
  });

  it("returns null when any required field is missing", () => {
    expect(parseSocialCaptions("{}")).toBeNull();
    expect(
      parseSocialCaptions(
        JSON.stringify({ instagram: "a", tiktok: "b", youtube: { title: "t" } }),
      ),
    ).toBeNull();
  });

  it("returns null for non-JSON input", () => {
    expect(parseSocialCaptions("not json")).toBeNull();
    expect(parseSocialCaptions("")).toBeNull();
  });
});

describe("clampCaption", () => {
  it("does not cut short text", () => {
    expect(clampCaption("short", 100)).toBe("short");
  });
  it("truncates on word boundary when possible", () => {
    const out = clampCaption("hello wonderful world", 12);
    expect(out.length).toBeLessThanOrEqual(12);
    expect(out.endsWith("wonderful") || out === "hello").toBe(true);
  });
});

describe("renderPlatformCaption", () => {
  const captions = {
    instagram: "IG body",
    tiktok: "TT body",
    youtube: { title: "Title", description: "Desc" },
  };
  it("joins YouTube title + description", () => {
    expect(renderPlatformCaption("youtube", captions)).toBe("Title\n\nDesc");
  });
  it("returns IG body verbatim when within limits", () => {
    expect(renderPlatformCaption("instagram", captions)).toBe("IG body");
  });
  it("returns TikTok body verbatim when within limits", () => {
    expect(renderPlatformCaption("tiktok", captions)).toBe("TT body");
  });
});
