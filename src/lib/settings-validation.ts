/** Shared validation for settings server actions and tests. */

export const MAX_SETTINGS_TEXT_LEN = 200;

export function validateOrganizationName(raw: string): { ok: true; value: string } | { ok: false; error: string } {
  const t = raw.trim();
  if (!t) return { ok: false, error: "Organization name is required." };
  if (t.length > MAX_SETTINGS_TEXT_LEN) {
    return { ok: false, error: `Use at most ${MAX_SETTINGS_TEXT_LEN} characters.` };
  }
  return { ok: true, value: t };
}

export function validateDisplayName(raw: string): { ok: true; value: string } | { ok: false; error: string } {
  const t = raw.trim();
  if (t.length > MAX_SETTINGS_TEXT_LEN) {
    return { ok: false, error: `Use at most ${MAX_SETTINGS_TEXT_LEN} characters.` };
  }
  return { ok: true, value: t };
}
