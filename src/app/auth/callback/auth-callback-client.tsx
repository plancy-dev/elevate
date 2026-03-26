"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getLoginPathWithAuthError } from "@/lib/auth-redirect-urls";

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
    const next = nextRaw?.startsWith("/") ? nextRaw : "/dashboard";

    if (error) {
      handled.current = true;
      router.replace(
        getLoginPathWithAuthError(window.location.origin, {
          error,
          errorCode: oauthErrorCode,
          errorDescription: oauthDescription,
          next,
        }),
      );
      return;
    }

    if (code) {
      handled.current = true;
      const supabase = createClient();
      void supabase.auth.exchangeCodeForSession(code).then(({ error: err }) => {
        if (err) {
          router.replace("/auth/auth-code-error");
          return;
        }
        router.replace(next);
        router.refresh();
      });
      return;
    }

    const t = window.setTimeout(() => {
      if (window.location.hash?.length > 1) {
        return;
      }
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
