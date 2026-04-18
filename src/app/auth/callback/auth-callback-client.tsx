"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { logAuthFlow } from "@/lib/auth-flow-log";

/**
 * Fallback when `/auth/callback` has no `?code=` / `?error=` (fragment-only flows
 * are handled by {@link SupabaseUrlHashHandler} in the root layout). Waits briefly
 * for a hash, then sends the user to the auth error page.
 */
function AuthCallbackInner() {
  const router = useRouter();

  useEffect(() => {
    logAuthFlow("auth.callback.client.mount_wait", {
      hashLength: typeof window !== "undefined" ? window.location.hash.length : 0,
    });

    const t = window.setTimeout(() => {
      if (window.location.hash?.length > 1) {
        logAuthFlow("auth.callback.client.hash_present_skip_error", {
          hashLen: window.location.hash.length,
        });
        return;
      }
      logAuthFlow("auth.callback.client.timeout_no_code_or_hash", {});
      router.replace("/auth/auth-code-error");
    }, 2000);

    return () => window.clearTimeout(t);
  }, [router]);

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
