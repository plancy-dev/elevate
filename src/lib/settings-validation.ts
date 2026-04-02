/** Shared validation for settings server actions and tests. */

import { ActionErrorCode } from "@/lib/i18n/action-error-codes";

export const MAX_SETTINGS_TEXT_LEN = 200;

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
