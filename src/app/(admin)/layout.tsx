import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { PostHogIdentify } from "@/components/analytics/posthog-identify";
import { AppShellIntlProvider } from "@/components/dashboard/app-shell-intl-provider";
import { DeskShell } from "@/components/desk";
import { ensureDefaultOrganization } from "@/actions/onboarding";
import { ActionErrorMessage } from "@/components/i18n/action-error-message";
import { loadSidebarUser } from "@/lib/dashboard/load-sidebar-user";
import { getPosthogPublicConfig } from "@/lib/env/posthog-public";
import { getAppLocale } from "@/lib/i18n/app-locale";
import { loadMessagesForLocale } from "@/lib/i18n/app-messages";
import { normalizeSidebarIconTonePreference } from "@/lib/settings-validation";
import { createClient } from "@/lib/supabase/server";
import { canAccessElevateServiceAdmin } from "@/lib/auth/platform-admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const ensured = await ensureDefaultOrganization();
  if (!ensured.ok) {
    return (
      <div className="min-h-screen bg-paper-50 p-6">
        <ActionErrorMessage code={ensured.error} />
      </div>
    );
  }

  const { data: prof } = await supabase
    .from("profiles")
    .select("organization_id, role, sidebar_icon_tone")
    .eq("id", user.id)
    .maybeSingle();

  if (!canAccessElevateServiceAdmin(user.email)) {
    redirect("/dashboard");
  }

  const sidebarUser = await loadSidebarUser(supabase, user);
  const ph = getPosthogPublicConfig();

  const locale = await getAppLocale();
  setRequestLocale(locale);
  const messages = await loadMessagesForLocale(locale);

  return (
    <AppShellIntlProvider locale={locale} messages={messages}>
      {ph && prof?.organization_id ? (
        <PostHogIdentify
          userId={user.id}
          email={user.email ?? null}
          organizationId={prof.organization_id}
          role={prof.role ?? "viewer"}
        />
      ) : null}
      <DeskShell
        mode="admin"
        user={sidebarUser}
        isOrgAdmin
        isServiceAdmin
        sidebarIconTonePreset={normalizeSidebarIconTonePreference(
          prof?.sidebar_icon_tone ?? null,
        )}
        recentEpisodes={[]}
      >
        {children}
      </DeskShell>
    </AppShellIntlProvider>
  );
}
