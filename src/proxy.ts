import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import {
  HERO_VARIANT_COOKIE,
  HERO_VARIANT_SOURCE_COOKIE,
  parseHeroVariant,
  parseHeroVariantSource,
  pickHeroVariant,
  type HeroVariant,
  type HeroVariantSource,
} from "@/lib/analytics/hero-variant";
import {
  classifyProxyRequest,
  shouldForceLoginRedirect,
} from "@/lib/proxy/skip-session";
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

function isLocaleRootPath(pathname: string) {
  if (pathname === "/") return true;
  const segments = pathname.split("/").filter(Boolean);
  return (
    segments.length === 1 &&
    (routing.locales as readonly string[]).includes(segments[0])
  );
}

function resolveHeroVariant(request: NextRequest) {
  const queryVariant = parseHeroVariant(request.nextUrl.searchParams.get("hero_variant"));
  const cookieVariant = parseHeroVariant(request.cookies.get(HERO_VARIANT_COOKIE)?.value);
  const source: HeroVariantSource = queryVariant
    ? "query"
    : cookieVariant
      ? "cookie"
      : "random";
  return {
    queryVariant,
    cookieVariant,
    source,
    assigned: queryVariant ?? cookieVariant ?? pickHeroVariant(),
  };
}

function setHeroVariantCookies(args: {
  response: NextResponse;
  variant: HeroVariant;
  source: HeroVariantSource;
}) {
  const base = {
    path: "/",
    httpOnly: false,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 90,
  };
  args.response.cookies.set({
    name: HERO_VARIANT_COOKIE,
    value: args.variant,
    ...base,
  });
  args.response.cookies.set({
    name: HERO_VARIANT_SOURCE_COOKIE,
    value: args.source,
    ...base,
  });
}

function withHeroVariantCookie(request: NextRequest, response: NextResponse) {
  if (!isLocaleRootPath(request.nextUrl.pathname)) return response;
  const { cookieVariant, source, assigned } = resolveHeroVariant(request);
  const cookieSource = parseHeroVariantSource(
    request.cookies.get(HERO_VARIANT_SOURCE_COOKIE)?.value,
  );
  if (cookieVariant === assigned && cookieSource === source) return response;

  setHeroVariantCookies({ response, variant: assigned, source });
  return response;
}

function maybeRedirectToCleanHeroVariantUrl(request: NextRequest) {
  if (!isLocaleRootPath(request.nextUrl.pathname)) return null;
  if (!request.nextUrl.searchParams.has("hero_variant")) return null;

  const url = request.nextUrl.clone();
  url.searchParams.delete("hero_variant");
  const response = NextResponse.redirect(url, 307);
  const { assigned, source } = resolveHeroVariant(request);
  setHeroVariantCookies({ response, variant: assigned, source });
  return response;
}

export async function proxy(request: NextRequest) {
  const resourcesRedirect = redirectResourcesToBlog(request);
  if (resourcesRedirect) return resourcesRedirect;

  const authForward = redirectAuthLandingToCallbackIfNeeded(request);
  if (authForward) return authForward;

  const heroVariantRedirect = maybeRedirectToCleanHeroVariantUrl(request);
  if (heroVariantRedirect) return heroVariantRedirect;

  const pathname = request.nextUrl.pathname;
  const classification = classifyProxyRequest({
    pathname,
    cookieNames: request.cookies.getAll().map((c) => c.name),
  });

  /**
   * Short-circuit for static + public paths (robots/sitemap/feed/webhooks).
   * No session check, no i18n — just pass the request through so Next
   * handles the response. This is the single largest quota save because
   * crawlers hit these constantly.
   */
  if (classification === "skip_static") {
    return withHeroVariantCookie(request, NextResponse.next({ request }));
  }

  /**
   * Anonymous request (no Supabase auth cookies). We can skip
   * `updateSession` entirely — `getUser()` would just return null after a
   * network round-trip. Still enforce the one guard we care about:
   * `/dashboard` must redirect to `/login`.
   */
  if (classification === "skip_anonymous") {
    if (shouldForceLoginRedirect(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return withHeroVariantCookie(request, NextResponse.redirect(url));
    }
    if (shouldSkipIntl(pathname)) {
      return withHeroVariantCookie(request, NextResponse.next({ request }));
    }
    return withHeroVariantCookie(request, intlMiddleware(request));
  }

  if (shouldSkipIntl(pathname)) {
    return withHeroVariantCookie(request, await updateSession(request));
  }

  const intlResponse = intlMiddleware(request);
  return withHeroVariantCookie(request, await updateSession(request, intlResponse));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
