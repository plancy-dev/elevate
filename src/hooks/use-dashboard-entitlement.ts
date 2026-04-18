"use client";

import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

function userKey(user: User | null | undefined): string {
  if (user === undefined) return "__pending__";
  if (user === null) return "__signed_out__";
  return user.id;
}

/**
 * Whether the signed-in user may use `/dashboard` (matches server `canUseDashboard`).
 * `undefined` while auth or entitlement is loading; `false` when signed out or denied.
 */
export function useDashboardEntitlement(
  user: User | null | undefined,
): boolean | undefined {
  const key = userKey(user);

  const [allowed, setAllowed] = useState<boolean | undefined>(() =>
    user === null ? false : undefined,
  );

  useEffect(() => {
    if (key === "__pending__") {
      queueMicrotask(() => setAllowed(undefined));
      return;
    }
    if (key === "__signed_out__") {
      queueMicrotask(() => setAllowed(false));
      return;
    }

    let cancelled = false;
    queueMicrotask(() => setAllowed(undefined));

    void fetch("/api/auth/dashboard-entitlement", {
      credentials: "same-origin",
      cache: "no-store",
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json() as Promise<{ allowed?: boolean }>;
      })
      .then((body) => {
        if (!cancelled) setAllowed(body.allowed === true);
      })
      .catch(() => {
        if (!cancelled) setAllowed(false);
      });

    return () => {
      cancelled = true;
    };
  }, [key]);

  return allowed;
}
