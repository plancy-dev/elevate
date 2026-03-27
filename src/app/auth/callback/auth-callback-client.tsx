"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  logAuthFlow,
  redactHref,
  snapshotSearchParams,
} from "@/lib/auth-flow-log";
import {
  AUTH_UPDATE_PASSWORD_PATH,
  DEFAULT_POST_LOGIN_PATH,
  getLoginPathWithAuthError,
} from "@/lib/auth-redirect-urls";
import { setRecoveryPendingClient } from "@/lib/auth-recovery-cookie";
import { resolvePostPkceRedirect } from "@/lib/auth-recovery-redirect";

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    const error = searchParams.get("error");
    const oauthDescription = searchParams.get("error_description");
    const oauthErrorCode = searchParams.get("error_code");
    const code = searchParams.get("code");
    const nextRaw = searchParams.get("next");
    const nextFallback = nextRaw?.startsWith("/") ? nextRaw : DEFAULT_POST_LOGIN_PATH;

    logAuthFlow("auth.callback.mount", {
      hrefRedacted: typeof window !== "undefined" ? redactHref(window.location.href) : "",
      querySafe: snapshotSearchParams(searchParams),
      hasCode: Boolean(code),
      hasError: Boolean(error),
      nextFallback,
      hashLength: typeof window !== "undefined" ? window.location.hash.length : 0,
    });

    if (error) {
      handled.current = true;
      logAuthFlow("auth.callback.branch", {
        branch: "oauth_error_to_login",
        error,
        oauthErrorCode,
      });
      router.replace(
        getLoginPathWithAuthError(window.location.origin, {
          error,
          errorCode: oauthErrorCode,
          errorDescription: oauthDescription,
          next: nextFallback,
        }),
      );
      return;
    }

    if (code) {
      handled.current = true;
      logAuthFlow("auth.callback.branch", {
        branch: "pkce_exchange",
        codeLen: code.length,
        nextFallback,
      });
      const supabase = createClient();
      void supabase.auth.exchangeCodeForSession(code).then(({ data, error: err }) => {
        if (err) {
          logAuthFlow("auth.callback.pkce_error", {
            message: err.message.slice(0, 300),
          });
          router.replace("/auth/auth-code-error");
          return;
        }
        const destination = resolvePostPkceRedirect(nextFallback, data, searchParams);
        const redirectType =
          data &&
          typeof data === "object" &&
          "redirectType" in data &&
          typeof (data as { redirectType?: unknown }).redirectType === "string"
            ? (data as { redirectType: string }).redirectType
            : null;
        logAuthFlow("auth.callback.pkce_done", {
          destination,
          redirectType,
          hasSession: Boolean(data?.session),
        });
        if (
          redirectType === "recovery" ||
          destination === AUTH_UPDATE_PASSWORD_PATH
        ) {
          setRecoveryPendingClient();
        }
        router.replace(destination);
        router.refresh();
      });
      return;
    }

    const t = window.setTimeout(() => {
      if (window.location.hash?.length > 1) {
        logAuthFlow("auth.callback.wait_hash", {
          hashLen: window.location.hash.length,
        });
        return;
      }
      logAuthFlow("auth.callback.timeout_no_code_or_hash", {});
      router.replace("/auth/auth-code-error");
    }, 2000);

    return () => window.clearTimeout(t);
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <p className="text-sm text-text-tertiary">Completing sign-in…</p>
    </div>
  );
}

export function AuthCallbackClient() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background" aria-busy aria-label="Loading" />
      }
    >
      <AuthCallbackInner />
    </Suspense>
  );
}
