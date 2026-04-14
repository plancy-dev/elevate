/** Parses optional UUID from form fields; returns null if empty or invalid. */
export function parseOptionalUuidFromForm(
  formData: FormData,
  key: string,
): string | null {
  const s = String(formData.get(key) ?? "").trim();
  if (s === "") return null;
  const uuidRe =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRe.test(s)) return null;
  return s;
}
