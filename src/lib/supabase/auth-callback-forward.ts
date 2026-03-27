import { type NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";
import { AUTH_CALLBACK_PATH } from "@/lib/auth-redirect-urls";

/**
 * When Supabase **Site URL** is the app root, PKCE email links (password recovery,
 * magic link, dashboard “Send recovery”) can land as `/?code=...` instead of
 * `/auth/callback?code=...`. The hash handler cannot see query params; the callback
 * page must run `exchangeCodeForSession`. Forward those requests to `/auth/callback`.
 */
function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

/** Locale home (`/en`, `/ko`, …) or site root `/` — marketing pages without the callback route. */
export function isAuthPkceLandingPath(pathname: string): boolean {
  const p = normalizePathname(pathname);
  if (p === "/") return true;
  return routing.locales.some((loc) => `/${loc}` === p);
}

function looksLikeSupabaseAuthQuery(url: URL): boolean {
  return url.searchParams.has("code") || url.searchParams.has("error");
}

/**
 * Returns a redirect to `/auth/callback` with the same query string, or null.
 */
export function redirectAuthLandingToCallbackIfNeeded(
  request: NextRequest,
): NextResponse | null {
  const url = request.nextUrl;
  if (url.pathname.startsWith(AUTH_CALLBACK_PATH)) return null;
  if (!isAuthPkceLandingPath(url.pathname)) return null;
  if (!looksLikeSupabaseAuthQuery(url)) return null;

  const target = new URL(AUTH_CALLBACK_PATH, request.url);
  url.searchParams.forEach((value, key) => {
    target.searchParams.set(key, value);
  });
  return NextResponse.redirect(target);
}
