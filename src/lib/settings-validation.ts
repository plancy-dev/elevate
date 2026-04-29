/** Shared validation for settings server actions and tests. */

import { ActionErrorCode } from "@/lib/i18n/action-error-codes";

export const MAX_SETTINGS_TEXT_LEN = 200;
export const SPINNER_TEMPO_VALUES = ["calm", "lively"] as const;
export type SpinnerTempoPreference = (typeof SPINNER_TEMPO_VALUES)[number];
export const DEFAULT_SPINNER_TEMPO: SpinnerTempoPreference = "calm";
export const SIDEBAR_ICON_TONE_VALUES = ["calm", "focus"] as const;
export type SidebarIconTonePreference = (typeof SIDEBAR_ICON_TONE_VALUES)[number];
export const DEFAULT_SIDEBAR_ICON_TONE: SidebarIconTonePreference = "focus";

export function validateOrganizationName(
  raw: string,
):
  | { ok: true; value: string }
  | { ok: false; error: string } {
  const t = raw.trim();
  if (!t) return { ok: false, error: ActionErrorCode.settingsOrgNameRequired };
  if (t.length > MAX_SETTINGS_TEXT_LEN) {
    return { ok: false, error: ActionErrorCode.settingsTextTooLong };
  }
  return { ok: true, value: t };
}

export function validateDisplayName(
  raw: string,
):
  | { ok: true; value: string }
  | { ok: false; error: string } {
  const t = raw.trim();
  if (t.length > MAX_SETTINGS_TEXT_LEN) {
    return { ok: false, error: ActionErrorCode.settingsTextTooLong };
  }
  return { ok: true, value: t };
}

export function normalizeSpinnerTempoPreference(raw: FormDataEntryValue | null): SpinnerTempoPreference {
  const value = typeof raw === "string" ? raw : "";
  return SPINNER_TEMPO_VALUES.includes(value as SpinnerTempoPreference)
    ? (value as SpinnerTempoPreference)
    : DEFAULT_SPINNER_TEMPO;
}

export function normalizeSidebarIconTonePreference(
  raw: FormDataEntryValue | null,
): SidebarIconTonePreference {
  const value = typeof raw === "string" ? raw : "";
  return SIDEBAR_ICON_TONE_VALUES.includes(value as SidebarIconTonePreference)
    ? (value as SidebarIconTonePreference)
    : DEFAULT_SIDEBAR_ICON_TONE;
}
