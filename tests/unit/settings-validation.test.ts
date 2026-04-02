import { describe, expect, it } from "vitest";
import { ActionErrorCode } from "@/lib/i18n/action-error-codes";
import {
  MAX_SETTINGS_TEXT_LEN,
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
