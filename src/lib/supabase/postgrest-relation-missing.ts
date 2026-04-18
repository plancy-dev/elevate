/**
 * Detect PostgREST errors when a table/view is not in the schema cache
 * (migration not applied yet, or cache reload pending).
 */
export function isMissingSchemaRelationError(
  error: { code?: string; message?: string } | null | undefined,
): boolean {
  if (!error) return false;
  if (error.code === "PGRST205") return true;
  const m = (error.message ?? "").toLowerCase();
  return (
    m.includes("could not find the table") && m.includes("schema cache")
  );
}
