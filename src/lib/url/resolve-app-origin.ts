import { headers } from "next/headers";

/**
 * Canonical app origin for server-side redirects (Lemon `redirect_url`, emails, etc.).
 * Prefer `NEXT_PUBLIC_APP_URL` in production; falls back to the current request host.
 */
export async function resolveAppOrigin(): Promise<string> {
  const env = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (env) return env.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}
