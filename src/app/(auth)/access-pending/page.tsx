import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ElevateLogo } from "@/components/layout/elevate-logo";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { buttonLinkClassName } from "@/components/ui/button-styles";
import { Link as LocaleLink } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { canUseDashboard } from "@/lib/auth/dashboard-access";
import { getAppLocale } from "@/lib/i18n/app-locale";

export async function generateMetadata() {
  const locale = await getAppLocale();
  /** Same as dashboard / `[locale]` layouts — avoids `LocaleLink` → `headers()` DYNAMIC_SERVER_USAGE. */
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "AccessPending" });
  return { title: t("metaTitle") };
}

/**
 * Shown when the signed-in user does not have `profiles.dashboard_access` (see `canUseDashboard`).
 */
export default async function AccessPendingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const allowed = await canUseDashboard(
    user.email ?? undefined,
    prof?.role,
    user.id,
  );
  if (allowed) {
    redirect("/dashboard");
  }

  const locale = await getAppLocale();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "AccessPending" });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12">
      <LocaleLink href="/" className="mb-10 inline-block">
        <ElevateLogo size="md" />
      </LocaleLink>
      <div className="w-full max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-text-primary">
          {t("title")}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-text-secondary">
          {t("body")}
        </p>
        {user.email ? (
          <p className="mt-3 rounded-md border border-border-subtle bg-layer-02 px-3 py-2 text-xs text-text-tertiary">
            {user.email}
          </p>
        ) : null}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <LocaleLink
            href="/#waitlist"
            className={buttonLinkClassName("primary", "md", "text-center")}
          >
            {t("joinWaitlist")}
          </LocaleLink>
          <LocaleLink
            href="/contact"
            className={buttonLinkClassName("tertiary", "md", "text-center")}
          >
            {t("contact")}
          </LocaleLink>
        </div>
        <div className="mt-10 flex flex-col items-center gap-4 border-t border-border-subtle pt-8">
          <SignOutButton />
          <LocaleLink
            href="/"
            className="text-sm text-interactive transition-colors hover:text-primary"
          >
            {t("backHome")}
          </LocaleLink>
        </div>
      </div>
    </div>
  );
}
