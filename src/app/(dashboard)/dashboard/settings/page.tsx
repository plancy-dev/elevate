import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ensureDefaultOrganization } from "@/actions/onboarding";
import { ActionErrorMessage } from "@/components/i18n/action-error-message";
import { ConnectedIdentities } from "@/components/auth/connected-identities";
import { SettingsLocaleForm } from "@/components/dashboard/settings-locale-form";
import { SettingsOrgForm } from "@/components/dashboard/settings-org-form";
import { SettingsProfileForm } from "@/components/dashboard/settings-profile-form";
import {
  normalizeSidebarIconTonePreference,
  normalizeSpinnerTempoPreference,
} from "@/lib/settings-validation";
import { getAppLocale } from "@/lib/i18n/app-locale";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types";

const ORG_MANAGERS: UserRole[] = ["admin", "organizer"];

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Dashboard.settings");
  return { title: t("metaTitle") };
}

export default async function SettingsPage() {
  const ensured = await ensureDefaultOrganization();
  if (!ensured.ok) {
    return (
      <div className="min-h-screen bg-paper-50 p-6">
        <ActionErrorMessage code={ensured.error} />
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const t = await getTranslations("Dashboard.settings");

  const [{ data: org }, { data: profile }] = await Promise.all([
    supabase
      .from("organizations")
      .select("name")
      .eq("id", ensured.organizationId)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select(
        "display_name, role, email_milestone_digest, ui_locale, loading_spinner_tempo, sidebar_icon_tone",
      )
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  const role = (profile?.role ?? "viewer") as UserRole;
  const canManageOrg = ORG_MANAGERS.includes(role);
  const digest =
    (profile as { email_milestone_digest?: boolean } | null)
      ?.email_milestone_digest ?? true;

  const locale = await getAppLocale();

  return (
    <div className="min-h-screen bg-paper-50">
      <div className="sticky top-0 z-30 flex items-center border-b border-ink-100 bg-paper-50 px-6 h-12">
        <h1 className="text-sm font-medium text-ink-900">{t("title")}</h1>
      </div>

      <div className="mx-auto w-full max-w-xl p-6">
        <div className="divide-y divide-border-subtle overflow-hidden rounded-[var(--radius-1)] border border-ink-100 bg-paper-0">
          <section className="px-5 py-6">
            <h2 className="text-xs font-medium uppercase tracking-wider text-ink-500">
              {t("connectedAccounts")}
            </h2>
            <div className="mt-4">
              <ConnectedIdentities />
            </div>
          </section>

          <section className="px-5 py-6">
            <h2 className="text-xs font-medium uppercase tracking-wider text-ink-500">
              {t("language.section")}
            </h2>
            <div className="mt-4">
              <SettingsLocaleForm defaultLocale={locale} />
            </div>
          </section>

          <section className="px-5 py-6">
            <h2 className="text-xs font-medium uppercase tracking-wider text-ink-500">
              {t("organization")}
            </h2>
            <div className="mt-4">
              {canManageOrg ? (
                <SettingsOrgForm defaultName={org?.name ?? ""} />
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs text-ink-700">
                      {t("orgNameReadOnly")}
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={org?.name ?? ""}
                      className="h-10 w-full border border-ink-100 bg-paper-0 px-3 text-sm text-ink-500 focus:outline-none"
                    />
                    <p className="mt-1 text-xs text-ink-500">
                      {t("orgNameHint")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="px-5 py-6">
            <h2 className="text-xs font-medium uppercase tracking-wider text-ink-500">
              {t("yourProfile")}
            </h2>
            <div className="mt-4">
              <SettingsProfileForm
                defaultDisplayName={profile?.display_name ?? ""}
                defaultEmailMilestoneDigest={digest}
                defaultLoadingSpinnerTempo={normalizeSpinnerTempoPreference(
                  profile?.loading_spinner_tempo ?? null,
                )}
                defaultSidebarIconTone={normalizeSidebarIconTonePreference(
                  profile?.sidebar_icon_tone ?? null,
                )}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
