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
import {
  isPkceVerifierMissingError,
  shouldAllowPkceErrorSessionRecovery,
} from "@/lib/auth/pkce-session-recovery";

/** Dedup PKCE exchange: React Strict Mode or remounts must not call `exchangeCodeForSession` twice with the same code. */
const pkceExchangeInflight = new Map<
  string,
  ReturnType<ReturnType<typeof createClient>["auth"]["exchangeCodeForSession"]>
>();

function getOrCreatePkceExchange(
  code: string,
): ReturnType<ReturnType<typeof createClient>["auth"]["exchangeCodeForSession"]> {
  let p = pkceExchangeInflight.get(code);
  if (!p) {
    const supabase = createClient();
    p = supabase.auth.exchangeCodeForSession(code);
    pkceExchangeInflight.set(code, p);
    void p.finally(() => {
      window.setTimeout(() => pkceExchangeInflight.delete(code), 15_000);
    });
  }
  return p;
}

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

    /**
     * Set recovery hint before `exchangeCodeForSession` resolves. Otherwise a parallel
     * navigation to `/login` (e.g. header link) can run middleware with no cookie yet
     * and hit `authed_user_to_dashboard` while the callback is still in flight.
     */
    if (
      (nextRaw && nextRaw.includes("update-password")) ||
      searchParams.get("type") === "recovery"
    ) {
      setRecoveryPendingClient();
      logAuthFlow("auth.callback.early_recovery_cookie", {
        reason: nextRaw?.includes("update-password") ? "next_query" : "type_query",
      });
    }

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
      void getOrCreatePkceExchange(code)
        .then(async ({ data, error: err }) => {
          if (err) {
            logAuthFlow("auth.callback.pkce_error", {
              message: err.message.slice(0, 300),
            });
            /**
             * Do not treat an unrelated existing session as "signed in" for this OAuth
             * redirect — especially `code verifier not found` (wrong browser / cleared storage).
             */
            if (isPkceVerifierMissingError(err.message)) {
              logAuthFlow("auth.callback.pkce_error_no_recovery", {
                reason: "verifier_missing_sign_out_stale",
              });
              await supabase.auth.signOut();
              router.replace("/auth/auth-code-error");
              router.refresh();
              return;
            }
            if (shouldAllowPkceErrorSessionRecovery(err.message)) {
              const {
                data: { session },
              } = await supabase.auth.getSession();
              if (session?.user) {
                logAuthFlow("auth.callback.pkce_error_recovered_session", {
                  message: err.message.slice(0, 200),
                });
                const redirectType =
                  data &&
                  typeof data === "object" &&
                  "redirectType" in data &&
                  typeof (data as { redirectType?: unknown }).redirectType ===
                    "string"
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
                  setRecoveryPendingClient();
                }
                router.replace(destination);
                router.refresh();
                return;
              }
            }
            router.replace("/auth/auth-code-error");
            router.refresh();
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
        })
        .catch(async (reason: unknown) => {
          const message =
            reason &&
            typeof reason === "object" &&
            "message" in reason &&
            typeof (reason as { message: unknown }).message === "string"
              ? (reason as { message: string }).message.slice(0, 300)
              : String(reason).slice(0, 300);
          logAuthFlow("auth.callback.pkce_reject", { message });
          if (isPkceVerifierMissingError(message)) {
            logAuthFlow("auth.callback.pkce_reject_no_recovery", {
              reason: "verifier_missing_sign_out_stale",
            });
            await supabase.auth.signOut();
            router.replace("/auth/auth-code-error");
            router.refresh();
            return;
          }
          if (shouldAllowPkceErrorSessionRecovery(message)) {
            const {
              data: { session },
            } = await supabase.auth.getSession();
            if (session?.user) {
              logAuthFlow("auth.callback.pkce_reject_recovered_session", {});
              const destination = resolvePostPkceRedirect(
                nextFallback,
                { session },
                searchParams,
              );
              router.replace(destination);
              router.refresh();
              return;
            }
          }
          router.replace("/auth/auth-code-error");
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
