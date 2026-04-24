/**
 * Middleware shortcuts for avoiding unnecessary Supabase auth calls.
 *
 * Context: `proxy.ts` used to call `updateSession()` on every request that
 * slipped past the matcher, which in turn calls `supabase.auth.getUser()` —
 * a network round-trip to the Supabase auth service. Bots, feed fetchers,
 * search-engine crawlers, and webhook callers never have a logged-in
 * session, so each of those requests was burning a quota unit for nothing.
 *
 * These helpers give the proxy three cheap, local gates before it reaches
 * for the Supabase client:
 *
 *   1. `shouldSkipSessionByPath()` — paths that are guaranteed public
 *      (robots.txt, sitemap, feed, webhooks, …). Short-circuit with
 *      `NextResponse.next()`.
 *   2. `hasSupabaseAuthCookies()` — when no session cookie is present we
 *      can skip `getUser()` entirely and rely on the request being
 *      anonymous.
 *   3. `shouldForceLoginRedirect()` — for the one anonymous case we still
 *      have to intercept: `/dashboard` visitors must bounce to `/login`.
 *
 * All three are pure + synchronous + test-friendly.
 */

/**
 * Paths that never need session handling. Hitting them with `getUser()`
 * does nothing useful and costs an auth request per visit.
 */
const STATIC_PUBLIC_PATHS: ReadonlySet<string> = new Set([
  "/robots.txt",
  "/sitemap.xml",
  "/feed.xml",
  "/llms.txt",
  "/manifest.json",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/icon.png",
  "/icon.svg",
  "/apple-icon.png",
  "/apple-touch-icon.png",
  "/opengraph-image.png",
  "/twitter-image.png",
]);

const STATIC_PUBLIC_PREFIXES: readonly string[] = [
  "/_next/static/",
  "/_next/image",
  "/.well-known/",
  // Webhook callbacks authenticate via signature, never via user session.
  "/api/webhooks/",
  // Public POST-only form endpoints — the route handler owns its auth.
  "/api/waitlist",
];

/**
 * File extension check — anything that looks like a static asset is almost
 * certainly served by Next.js without needing auth. Covers `.css`, `.js`,
 * `.woff2`, `.map`, etc.
 */
function looksLikeStaticAsset(pathname: string): boolean {
  return /\.[A-Za-z0-9]{1,6}$/.test(pathname);
}

/**
 * Prefixes that should NEVER be treated as static assets even if the path
 * happens to end in an extension. These house real route handlers / pages
 * whose auth requirements must be preserved.
 */
const DYNAMIC_ROUTE_PREFIXES: readonly string[] = [
  "/dashboard",
  "/api",
  "/admin",
  "/auth",
];

export function shouldSkipSessionByPath(pathname: string): boolean {
  if (STATIC_PUBLIC_PATHS.has(pathname)) return true;
  for (const prefix of STATIC_PUBLIC_PREFIXES) {
    if (pathname.startsWith(prefix)) return true;
  }
  if (looksLikeStaticAsset(pathname)) {
    for (const prefix of DYNAMIC_ROUTE_PREFIXES) {
      if (pathname.startsWith(prefix)) return false;
    }
    return true;
  }
  return false;
}

/**
 * Supabase SSR stores the user access token in a cookie named
 * `sb-<project-ref>-auth-token`, sometimes chunked as `.0`, `.1`, etc.
 * Treating that single shape as the sentinel is enough to detect
 * "this request has a session attached".
 */
export function hasSupabaseAuthCookies(cookieNames: readonly string[]): boolean {
  for (const name of cookieNames) {
    if (!name.startsWith("sb-")) continue;
    // Base cookie or chunked variants (.0, .1, …).
    if (/^sb-[^.]+-auth-token(?:\.\d+)?$/.test(name)) return true;
  }
  return false;
}

/**
 * When a user without a session hits `/dashboard` we must still redirect
 * them to `/login` so server components don't 500. All other anonymous
 * paths can pass straight through.
 */
export function shouldForceLoginRedirect(pathname: string): boolean {
  return pathname.startsWith("/dashboard");
}

/**
 * Combined convenience: returns the reason we should skip `updateSession`,
 * or `null` when we should not skip. Used by the proxy and tests.
 */
export function classifyProxyRequest(opts: {
  pathname: string;
  cookieNames: readonly string[];
}): "skip_static" | "skip_anonymous" | "needs_session" {
  if (shouldSkipSessionByPath(opts.pathname)) return "skip_static";
  if (!hasSupabaseAuthCookies(opts.cookieNames)) return "skip_anonymous";
  return "needs_session";
}
