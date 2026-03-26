"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  AUTH_UPDATE_PASSWORD_PATH,
  getLoginPathWithAuthError,
} from "@/lib/auth-redirect-urls";

/**
 * Supabase redirects recovery / magic links to `redirectTo` or Site URL with
 * tokens or errors in the **hash** (fragment). Fragments are never sent to the
 * server, so only the browser can read them. This handler parses the hash on
 * load, sets the session from access/refresh tokens, or forwards errors to login.
 */
export function SupabaseUrlHashHandler() {
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    if (typeof window === "undefined") return;

    const hash = window.location.hash;
    if (!hash || hash.length <= 1) return;

    const params = new URLSearchParams(hash.slice(1));
    const error = params.get("error");
    const errorCode = params.get("error_code");
    const errorDescription = params.get("error_description");

    const clearHash = () => {
      const { pathname, search } = window.location;
      window.history.replaceState(null, "", `${pathname}${search}`);
    };

    if (error) {
      ran.current = true;
      clearHash();
      router.replace(
        getLoginPathWithAuthError(window.location.origin, {
          error,
          errorCode,
          errorDescription,
        }),
      );
      return;
    }

    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const flowType = params.get("type");
    if (accessToken && refreshToken) {
      ran.current = true;
      void (async () => {
        const supabase = createClient();
        const { error: sessionErr } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        clearHash();
        if (sessionErr) {
          router.replace(
            getLoginPathWithAuthError(window.location.origin, {
              error: "session_error",
              errorDescription: sessionErr.message.slice(0, 300),
            }),
          );
          return;
        }
        const afterAuth =
          flowType === "recovery" ? AUTH_UPDATE_PASSWORD_PATH : "/dashboard";
        router.replace(afterAuth);
        router.refresh();
      })();
    }
  }, [router]);

  return null;
}
