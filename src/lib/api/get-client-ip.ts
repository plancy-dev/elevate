import "server-only";

/**
 * Best-effort client IP for rate limiting behind Vercel / proxies.
 * Not for security-critical allowlists (spoofable without trusted proxy config).
 */
export function getClientIpFromHeaders(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const vercel = headers.get("x-vercel-forwarded-for")?.trim();
  if (vercel) return vercel.split(",")[0]?.trim() || vercel;
  return "unknown";
}
