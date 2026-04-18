import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_UPDATE_PASSWORD_PATH,
  DEFAULT_POST_LOGIN_PATH,
  getLoginPathWithAuthError,
} from "@/lib/auth-redirect-urls";
import { AUTH_RECOVERY_PENDING_COOKIE } from "@/lib/auth-recovery-cookie";
import { resolvePostPkceRedirect } from "@/lib/auth-recovery-redirect";
import {
  logAuthFlow,
  snapshotSearchParams,
} from "@/lib/auth-flow-log";
import {
  isPkceVerifierMissingError,
  shouldAllowPkceErrorSessionRecovery,
} from "@/lib/auth/pkce-session-recovery";
import { assertPublicSupabaseEnv } from "@/lib/env/public";
import type { Database } from "@/types/database.types";

/** Accumulate Set-Cookie from Supabase, then attach to the final redirect response. */
function mergeCookiesInto(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((c) => {
    to.cookies.set(c.name, c.value);
  });
}

const PUBLIC_ORIGIN_FOR_URL_PARSE =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const searchParams = requestUrl.searchParams;
  const code = searchParams.get("code")?.trim() || null;
  const error = searchParams.get("error");
  const oauthDescription = searchParams.get("error_description");
  const oauthErrorCode = searchParams.get("error_code");
  const nextRaw = searchParams.get("next");
  const nextFallback =
    nextRaw?.startsWith("/") ? nextRaw : DEFAULT_POST_LOGIN_PATH;

  logAuthFlow("auth.callback.route.mount", {
    querySafe: snapshotSearchParams(searchParams),
    hasCode: Boolean(code),
    hasError: Boolean(error),
    nextFallback,
  });

  if (!code && !error) {
    return NextResponse.redirect(
      new URL("/auth/callback/continue", request.url),
    );
  }

  if (error) {
    logAuthFlow("auth.callback.route.branch", {
      branch: "oauth_error_to_login",
      error,
      oauthErrorCode,
    });
    const pathWithSearch = getLoginPathWithAuthError(
      PUBLIC_ORIGIN_FOR_URL_PARSE,
      {
        error,
        errorCode: oauthErrorCode,
        errorDescription: oauthDescription,
        next: nextFallback,
      },
    );
    return NextResponse.redirect(new URL(pathWithSearch, request.url));
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/auth/callback/continue", request.url),
    );
  }

  const { url: supabaseUrl, anonKey } = assertPublicSupabaseEnv();
  const cookieJar = new NextResponse(null, { status: 200 });

  const setRecoveryCookie = () => {
    cookieJar.cookies.set(AUTH_RECOVERY_PENDING_COOKIE, "1", {
      path: "/",
      maxAge: 3600,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  };

  if (
    (nextRaw && nextRaw.includes("update-password")) ||
    searchParams.get("type") === "recovery"
  ) {
    setRecoveryCookie();
    logAuthFlow("auth.callback.route.early_recovery_cookie", {
      reason: nextRaw?.includes("update-password") ? "next_query" : "type_query",
    });
  }

  const supabase = createServerClient<Database>(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieJar.cookies.set(name, value, options),
        );
      },
    },
  });

  logAuthFlow("auth.callback.route.branch", {
    branch: "pkce_exchange",
    codeLen: code.length,
    nextFallback,
  });

  const { data, error: exchangeErr } =
    await supabase.auth.exchangeCodeForSession(code);

  if (exchangeErr) {
    const msg = exchangeErr.message.slice(0, 300);
    logAuthFlow("auth.callback.route.pkce_error", { message: msg });

    if (isPkceVerifierMissingError(exchangeErr.message)) {
      logAuthFlow("auth.callback.route.pkce_error_no_recovery", {
        reason: "verifier_missing_sign_out_stale",
      });
      await supabase.auth.signOut();
      const redirectResponse = NextResponse.redirect(
        new URL("/auth/auth-code-error", request.url),
      );
      mergeCookiesInto(cookieJar, redirectResponse);
      return redirectResponse;
    }

    if (shouldAllowPkceErrorSessionRecovery(exchangeErr.message)) {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        logAuthFlow("auth.callback.route.pkce_error_recovered_session", {
          message: exchangeErr.message.slice(0, 200),
        });
        const redirectType =
          data &&
          typeof data === "object" &&
          "redirectType" in data &&
          typeof (data as { redirectType?: unknown }).redirectType === "string"
            ? (data as { redirectType: string }).redirectType
            : null;
        const destination = resolvePostPkceRedirect(
          nextFallback,
          { session, redirectType },
          searchParams,
        );
        if (
          redirectType === "recovery" ||
          destination === AUTH_UPDATE_PASSWORD_PATH
        ) {
          setRecoveryCookie();
        }
        const redirectResponse = NextResponse.redirect(
          new URL(destination, request.url),
        );
        mergeCookiesInto(cookieJar, redirectResponse);
        return redirectResponse;
      }
    }

    const redirectResponse = NextResponse.redirect(
      new URL("/auth/auth-code-error", request.url),
    );
    mergeCookiesInto(cookieJar, redirectResponse);
    return redirectResponse;
  }

  const destination = resolvePostPkceRedirect(
    nextFallback,
    data,
    searchParams,
  );
  const redirectType =
    data &&
    typeof data === "object" &&
    "redirectType" in data &&
    typeof (data as { redirectType?: unknown }).redirectType === "string"
      ? (data as { redirectType: string }).redirectType
      : null;

  logAuthFlow("auth.callback.route.pkce_done", {
    destination,
    redirectType,
    hasSession: Boolean(data?.session),
  });

  if (
    redirectType === "recovery" ||
    destination === AUTH_UPDATE_PASSWORD_PATH
  ) {
    setRecoveryCookie();
  }

  const redirectResponse = NextResponse.redirect(
    new URL(destination, request.url),
  );
  mergeCookiesInto(cookieJar, redirectResponse);
  return redirectResponse;
}
