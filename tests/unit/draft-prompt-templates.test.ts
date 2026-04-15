import { describe, expect, it } from "vitest";
import {
  CUSTOM_DRAFT_TEMPLATE_PREFIX,
  DEFAULT_DRAFT_TEMPLATE_KEY,
  getDraftTemplateBiasText,
  normalizeDraftTemplateKey,
  parseCustomDraftTemplateId,
} from "@/lib/studio-productions/draft-prompt-templates";

describe("normalizeDraftTemplateKey", () => {
  it("returns default for empty or unknown keys", () => {
    expect(normalizeDraftTemplateKey("")).toBe(DEFAULT_DRAFT_TEMPLATE_KEY);
    expect(normalizeDraftTemplateKey("  ")).toBe(DEFAULT_DRAFT_TEMPLATE_KEY);
    expect(normalizeDraftTemplateKey("nope")).toBe(DEFAULT_DRAFT_TEMPLATE_KEY);
  });

  it("accepts valid keys", () => {
    expect(normalizeDraftTemplateKey("punchy_shorts")).toBe("punchy_shorts");
    expect(normalizeDraftTemplateKey(" soft_cta ")).toBe("soft_cta");
  });
});

describe("getDraftTemplateBiasText", () => {
  it("returns non-empty English bias for each key", () => {
    expect(getDraftTemplateBiasText("default").length).toBeGreaterThan(20);
    expect(getDraftTemplateBiasText("punchy_shorts")).toContain("hook");
  });
});

describe("parseCustomDraftTemplateId", () => {
  it("parses uuid after custom: prefix", () => {
    const id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
    expect(parseCustomDraftTemplateId(`${CUSTOM_DRAFT_TEMPLATE_PREFIX}${id}`)).toBe(
      id,
    );
    expect(parseCustomDraftTemplateId("default")).toBeNull();
    expect(parseCustomDraftTemplateId(`${CUSTOM_DRAFT_TEMPLATE_PREFIX}not-uuid`)).toBeNull();
  });
});
