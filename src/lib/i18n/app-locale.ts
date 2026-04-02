import { hasLocale } from "next-intl";
import { cookies } from "next/headers";
import { cache } from "react";
import { routing } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";

/** Cookie mirrors profile `ui_locale` for SSR before profile is read, and for middleware-free routes. */
export const APP_LOCALE_COOKIE = "ELEVATE_APP_LOCALE";

export function normalizeAppLocale(
  raw: string | null | undefined,
): (typeof routing.locales)[number] {
  if (raw && hasLocale(routing.locales, raw)) {
    return raw;
  }
  return routing.defaultLocale;
}

/**
 * Resolved locale for dashboard/admin: profile `ui_locale` wins, then cookie, then default.
 * Cached once per request (React cache).
 */
export const getAppLocale = cache(async (): Promise<(typeof routing.locales)[number]> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const cookieStore = await cookies();
  const cookieRaw = cookieStore.get(APP_LOCALE_COOKIE)?.value;

  if (!user) {
    return normalizeAppLocale(cookieRaw);
  }

  const { data: prof } = await supabase
    .from("profiles")
    .select("ui_locale")
    .eq("id", user.id)
    .maybeSingle();

  return normalizeAppLocale(prof?.ui_locale ?? cookieRaw);
});
