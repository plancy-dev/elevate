import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AccessPendingSignOut } from "@/components/auth/access-pending-sign-out";
import { ElevateLogo } from "@/components/layout/elevate-logo";
import { buttonLinkClassName } from "@/components/ui/button-styles";
import { canUseDashboard } from "@/lib/auth/dashboard-access";
import { getAppLocale } from "@/lib/i18n/app-locale";
import {
  marketingContactPath,
  marketingHomePath,
  marketingWaitlistHref,
} from "@/lib/i18n/marketing-paths";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata() {
  const locale = await getAppLocale();
  const t = await getTranslations({ locale, namespace: "AccessPending" });
  return { title: t("metaTitle") };
}

/**
 * Signed-in users without dashboard access (`profiles.dashboard_access` and not `role: admin`).
 * Uses `next/link` only — no `next-intl` navigation here (avoids `headers()` / provider issues on auth routes).
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
  const t = await getTranslations({ locale, namespace: "AccessPending" });

  const home = marketingHomePath(locale);
  const contact = marketingContactPath(locale);
  const waitlist = marketingWaitlistHref(locale);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper-50 px-6 py-12">
      <Link href={home} className="mb-10 inline-block">
        <ElevateLogo size="md" />
      </Link>
      <div className="w-full max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-ink-900">
          {t("title")}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-ink-700">
          {t("body")}
        </p>
        {user.email ? (
          <p className="mt-3 border border-ink-100 bg-paper-100 px-3 py-2 text-xs text-ink-500">
            {user.email}
          </p>
        ) : null}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href={waitlist}
            className={buttonLinkClassName("primary", "md", "text-center")}
          >
            {t("joinWaitlist")}
          </Link>
          <Link
            href={contact}
            className={buttonLinkClassName("tertiary", "md", "text-center")}
          >
            {t("contact")}
          </Link>
        </div>
        <div className="mt-10 flex flex-col items-center gap-4 border-t border-ink-100 pt-8">
          <AccessPendingSignOut label={t("signOut")} />
          <Link
            href={home}
            className="text-sm text-vermilion-600 transition-colors duration-80 ease-(--ease-editorial) hover:text-vermilion-700"
          >
            {t("backHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}
