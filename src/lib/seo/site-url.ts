/**
 * Canonical site origin for metadata, sitemaps, and JSON-LD.
 * Production: set `NEXT_PUBLIC_APP_URL` to the public origin (no trailing slash),
 * e.g. `https://elevate.ai.kr` — must match Supabase Site URL / OAuth redirect allow-list.
 */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (raw) return raw.replace(/\/$/, "");
  return "http://localhost:3000";
}
