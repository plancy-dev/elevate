import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { redirectAuthLandingToCallbackIfNeeded } from "@/lib/supabase/auth-callback-forward";
import { updateSession } from "@/lib/supabase/update-session";

const intlMiddleware = createIntlMiddleware(routing);

/** Locales that use a URL prefix (all except `as-needed` default). */
const PREFIXED_LOCALES = routing.locales.filter(
  (locale) => locale !== routing.defaultLocale,
);

const RESOURCES_PREFIXED_PATH = new RegExp(
  `^/(${PREFIXED_LOCALES.join("|")})/resources$`,
);

const SKIP_INTL_PREFIXES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/access-pending",
  "/dashboard",
  "/admin",
  "/auth",
  "/icon.png",
  "/icon.svg",
  "/apple-icon.png",
  "/favicon.ico",
];

/** next.config redirects — must not pass through locale prefix. */
const MARKETING_SHORTLINKS = new Set([
  "/ig",
  "/x",
  "/threads",
  "/yt",
  "/links",
]);

function shouldSkipIntl(pathname: string) {
  if (MARKETING_SHORTLINKS.has(pathname)) return true;
  if (pathname.startsWith("/dashboard")) return true;
  if (pathname.startsWith("/admin")) return true;
  if (pathname.startsWith("/invite")) return true;
  if (pathname.startsWith("/auth")) return true;
  if (pathname.startsWith("/access-pending")) return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/api")) return true;
  if (SKIP_INTL_PREFIXES.some((p) => pathname === p)) return true;
  if (/\.[\w]+$/.test(pathname)) return true;
  return false;
}

/** Removed marketing route; send legacy URLs to blog before i18n + page render. */
function redirectResourcesToBlog(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/resources") {
    const url = request.nextUrl.clone();
    url.pathname = "/blog";
    return NextResponse.redirect(url, 308);
  }
  const prefixed = pathname.match(RESOURCES_PREFIXED_PATH);
  if (prefixed) {
    const url = request.nextUrl.clone();
    url.pathname = `/${prefixed[1]}/blog`;
    return NextResponse.redirect(url, 308);
  }
  return null;
}

export async function proxy(request: NextRequest) {
  const resourcesRedirect = redirectResourcesToBlog(request);
  if (resourcesRedirect) return resourcesRedirect;

  const authForward = redirectAuthLandingToCallbackIfNeeded(request);
  if (authForward) return authForward;

  if (shouldSkipIntl(request.nextUrl.pathname)) {
    return updateSession(request);
  }

  const intlResponse = intlMiddleware(request);
  return updateSession(request, intlResponse);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
