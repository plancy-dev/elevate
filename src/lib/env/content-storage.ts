/** Server-only: Supabase Storage bucket for digital products (create in dashboard; RLS/policies per ops). */
export function getContentStorageBucket(): string {
  return process.env.CONTENT_STORAGE_BUCKET?.trim() || "elevate-content";
}
