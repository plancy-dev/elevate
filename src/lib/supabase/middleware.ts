import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { AUTH_UPDATE_PASSWORD_PATH } from "@/lib/auth-redirect-urls";
import { hasRecoveryPendingCookie } from "@/lib/auth-recovery-cookie";
import { jwtIndicatesPasswordRecovery } from "@/lib/auth-recovery-redirect";
import { logAuthFlow } from "@/lib/auth-flow-log";

/**
 * Refreshes the Supabase session and merges auth cookies into `response`.
 * Pass the response from upstream middleware (e.g. next-intl) so redirects keep cookies.
 */
export async function updateSession(
  request: NextRequest,
  response?: NextResponse,
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response ?? NextResponse.next({ request });
  }

  const supabaseResponse = response ?? NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const accessToken = session?.access_token;
  const jwtRecovery =
    Boolean(accessToken) && jwtIndicatesPasswordRecovery(accessToken);
  const recoveryCookie = hasRecoveryPendingCookie(request);
  /** JWT `amr` recovery OR client-set hint (survives token refresh in Edge). */
  const isRecoveryHint = jwtRecovery || recoveryCookie;

  const path = request.nextUrl.pathname;

  /**
   * Password-reset emails establish a recovery session before the user sets a new password.
   * Do not send them to /dashboard or bounce them from /login — route to update-password.
   */
  if (user && isRecoveryHint) {
    const onUpdatePassword =
      path === AUTH_UPDATE_PASSWORD_PATH ||
      path.startsWith(`${AUTH_UPDATE_PASSWORD_PATH}/`);
    if (!onUpdatePassword) {
      const recoveryRedirect =
        path.startsWith("/dashboard") ||
        path === "/login" ||
        path === "/signup" ||
        path === "/forgot-password";
      if (recoveryRedirect) {
        logAuthFlow("middleware.session_guard", {
          action: "recovery_session_to_update_password",
          path,
          via: recoveryCookie ? "cookie" : "jwt_amr",
        });
        const redirectResponse = NextResponse.redirect(
          new URL(AUTH_UPDATE_PASSWORD_PATH, request.url),
        );
        supabaseResponse.cookies.getAll().forEach((c) => {
          redirectResponse.cookies.set(c.name, c.value);
        });
        return redirectResponse;
      }
    }
  }

  if (!user && path.startsWith("/dashboard")) {
    logAuthFlow("middleware.session_guard", {
      action: "dashboard_requires_login",
      path,
    });
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((c) => {
      redirectResponse.cookies.set(c.name, c.value);
    });
    return redirectResponse;
  }

  if (
    user &&
    (path === "/login" || path === "/signup" || path === "/forgot-password")
  ) {
    logAuthFlow("middleware.session_guard", {
      action: "authed_user_to_dashboard",
      path,
      jwtRecovery,
      recoveryCookieHint: recoveryCookie,
    });
    const redirectResponse = NextResponse.redirect(
      new URL("/dashboard", request.url),
    );
    supabaseResponse.cookies.getAll().forEach((c) => {
      redirectResponse.cookies.set(c.name, c.value);
    });
    return redirectResponse;
  }

  return supabaseResponse;
}
