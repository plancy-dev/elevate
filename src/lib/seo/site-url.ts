/**
 * Canonical site origin for metadata, sitemaps, and JSON-LD.
 * Set NEXT_PUBLIC_APP_URL in production (e.g. https://www.example.com).
 */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (raw) return raw.replace(/\/$/, "");
  return "http://localhost:3000";
}
