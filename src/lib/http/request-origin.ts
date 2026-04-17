/**
 * Builds an absolute origin for redirects from Route Handlers (uses proxy headers when present).
 */
export function getRequestOrigin(request: Request): string {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) {
    const fallback =
      process.env.NEXT_PUBLIC_APP_URL?.trim() ??
      process.env.VERCEL_URL?.trim();
    if (fallback) {
      const withScheme = fallback.startsWith("http")
        ? fallback
        : `https://${fallback}`;
      return withScheme.replace(/\/$/, "");
    }
    return "http://localhost:3000";
  }
  const proto =
    forwardedProto ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
