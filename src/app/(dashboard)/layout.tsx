import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { PostHogIdentify } from "@/components/analytics/posthog-identify";
import { AppShellIntlProvider } from "@/components/dashboard/app-shell-intl-provider";
import { DeskShell } from "@/components/desk";
import { ElevateSpinnerTempoProvider } from "@/components/ui/elevate-spinner";
import { ensureDefaultOrganization } from "@/actions/onboarding";
import { ActionErrorMessage } from "@/components/i18n/action-error-message";
import { loadSidebarUser } from "@/lib/dashboard/load-sidebar-user";
import { getPosthogPublicConfig } from "@/lib/env/posthog-public";
import { getAppLocale } from "@/lib/i18n/app-locale";
import { loadMessagesForLocale } from "@/lib/i18n/app-messages";
import {
  normalizeSidebarIconTonePreference,
  normalizeSpinnerTempoPreference,
} from "@/lib/settings-validation";
import { createClient } from "@/lib/supabase/server";
import {
  canAccessElevateServiceAdmin,
  canAccessOrganizationAdminConsole,
} from "@/lib/auth/platform-admin";
import { canUseDashboard } from "@/lib/auth/dashboard-access";

export default async function DashboardLayout({
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

  const { data: prof } = await supabase
    .from("profiles")
    .select("organization_id, role, loading_spinner_tempo, sidebar_icon_tone")
    .eq("id", user.id)
    .maybeSingle();

  const dashboardAllowed = await canUseDashboard(
    user.email ?? undefined,
    prof?.role,
    user.id,
  );
  if (!dashboardAllowed) {
    redirect("/access-pending");
  }

  const ensured = await ensureDefaultOrganization();
  if (!ensured.ok) {
    return (
      <div className="min-h-screen bg-paper-50 p-6">
        <ActionErrorMessage code={ensured.error} />
      </div>
    );
  }

  const sidebarUser = await loadSidebarUser(supabase, user);

  const ph = getPosthogPublicConfig();
  const showOrganizationHub = canAccessOrganizationAdminConsole(prof?.role);
  const showServiceAdmin = canAccessElevateServiceAdmin(user.email);

  const { data: recentEpisodeRows } = prof?.organization_id
    ? await supabase
        .from("studio_production_episodes")
        .select("id,title")
        .eq("organization_id", prof.organization_id)
        .order("updated_at", { ascending: false })
        .limit(5)
    : { data: [] as { id: string; title: string | null }[] };

  const recentEpisodes = (recentEpisodeRows ?? []).map((episode) => ({
    id: episode.id,
    title: episode.title ?? "Untitled episode",
  }));

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
      <ElevateSpinnerTempoProvider
        tempo={normalizeSpinnerTempoPreference(prof?.loading_spinner_tempo ?? null)}
      >
        <DeskShell
          mode="dashboard"
          user={sidebarUser}
          isOrgAdmin={showOrganizationHub}
          isServiceAdmin={showServiceAdmin}
          sidebarIconTonePreset={normalizeSidebarIconTonePreference(
            prof?.sidebar_icon_tone ?? null,
          )}
          recentEpisodes={recentEpisodes}
        >
          {children}
        </DeskShell>
      </ElevateSpinnerTempoProvider>
    </AppShellIntlProvider>
  );
}
