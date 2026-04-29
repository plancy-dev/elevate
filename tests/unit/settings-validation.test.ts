import { describe, expect, it } from "vitest";
import { ActionErrorCode } from "@/lib/i18n/action-error-codes";
import {
  DEFAULT_SIDEBAR_ICON_TONE,
  DEFAULT_SPINNER_TEMPO,
  MAX_SETTINGS_TEXT_LEN,
  normalizeSidebarIconTonePreference,
  normalizeSpinnerTempoPreference,
  validateDisplayName,
  validateOrganizationName,
} from "@/lib/settings-validation";

describe("validateOrganizationName", () => {
  it("accepts trimmed name", () => {
    const r = validateOrganizationName("  Acme Corp  ");
    expect(r).toEqual({ ok: true, value: "Acme Corp" });
  });

  it("rejects empty", () => {
    const r = validateOrganizationName("   ");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe(ActionErrorCode.settingsOrgNameRequired);
  });

  it("rejects too long", () => {
    const r = validateOrganizationName("x".repeat(MAX_SETTINGS_TEXT_LEN + 1));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe(ActionErrorCode.settingsTextTooLong);
  });
});

describe("validateDisplayName", () => {
  it("allows empty", () => {
    const r = validateDisplayName("  ");
    expect(r).toEqual({ ok: true, value: "" });
  });

  it("rejects too long", () => {
    const r = validateDisplayName("x".repeat(MAX_SETTINGS_TEXT_LEN + 1));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe(ActionErrorCode.settingsTextTooLong);
  });
});

describe("normalizeSpinnerTempoPreference", () => {
  it("keeps calm and lively", () => {
    expect(normalizeSpinnerTempoPreference("calm")).toBe("calm");
    expect(normalizeSpinnerTempoPreference("lively")).toBe("lively");
  });

  it("falls back to default on invalid value", () => {
    expect(normalizeSpinnerTempoPreference("fast")).toBe(DEFAULT_SPINNER_TEMPO);
    expect(normalizeSpinnerTempoPreference(null)).toBe(DEFAULT_SPINNER_TEMPO);
  });
});

describe("normalizeSidebarIconTonePreference", () => {
  it("keeps calm and focus", () => {
    expect(normalizeSidebarIconTonePreference("calm")).toBe("calm");
    expect(normalizeSidebarIconTonePreference("focus")).toBe("focus");
  });

  it("falls back to default on invalid value", () => {
    expect(normalizeSidebarIconTonePreference("lively")).toBe(DEFAULT_SIDEBAR_ICON_TONE);
    expect(normalizeSidebarIconTonePreference(null)).toBe(DEFAULT_SIDEBAR_ICON_TONE);
  });
});
