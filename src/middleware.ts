import createIntlMiddleware from "next-intl/middleware";
import { type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { redirectAuthLandingToCallbackIfNeeded } from "@/lib/supabase/auth-callback-forward";
import { updateSession } from "@/lib/supabase/middleware";

const intlMiddleware = createIntlMiddleware(routing);

const SKIP_INTL_PREFIXES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/dashboard",
  "/auth",
  "/icon.svg",
  "/icon.png",
  "/apple-icon.png",
  "/favicon.ico",
];

function shouldSkipIntl(pathname: string) {
  if (pathname.startsWith("/dashboard")) return true;
  if (pathname.startsWith("/auth")) return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/api")) return true;
  if (SKIP_INTL_PREFIXES.some((p) => pathname === p)) return true;
  if (/\.[\w]+$/.test(pathname)) return true;
  return false;
}

export async function middleware(request: NextRequest) {
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
