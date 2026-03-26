"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Supabase redirects recovery / magic links to `redirectTo` or Site URL with
 * tokens or errors in the **hash** (fragment). Fragments are never sent to the
 * server, so `app/auth/callback/route.ts` cannot see them. This client handler
 * parses the hash on any page load and redirects or establishes a session.
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
      const login = new URL("/login", window.location.origin);
      login.searchParams.set("auth_error", error);
      if (errorCode) login.searchParams.set("auth_error_code", errorCode);
      if (errorDescription) {
        login.searchParams.set(
          "auth_error_description",
          errorDescription.slice(0, 500),
        );
      }
      router.replace(login.pathname + login.search);
      return;
    }

    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
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
          const login = new URL("/login", window.location.origin);
          login.searchParams.set("auth_error", "session_error");
          login.searchParams.set(
            "auth_error_description",
            sessionErr.message.slice(0, 300),
          );
          router.replace(login.pathname + login.search);
          return;
        }
        router.replace("/dashboard");
        router.refresh();
      })();
    }
  }, [router]);

  return null;
}
