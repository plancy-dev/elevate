"use server";

import { hasLocale } from "next-intl";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { routing } from "@/i18n/routing";
import { APP_LOCALE_COOKIE } from "@/lib/i18n/app-locale";
import { createClient } from "@/lib/supabase/server";

export async function setAppLocale(locale: string): Promise<{ ok: boolean; error?: string }> {
  if (!hasLocale(routing.locales, locale)) {
    return { ok: false, error: "invalid_locale" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "unauthorized" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ ui_locale: locale })
    .eq("id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  const store = await cookies();
  store.set(APP_LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  revalidatePath("/dashboard", "layout");
  revalidatePath("/admin", "layout");
  return { ok: true };
}
