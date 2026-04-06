import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { PostHogIdentify } from "@/components/analytics/posthog-identify";
import { AppShellIntlProvider } from "@/components/dashboard/app-shell-intl-provider";
import { Sidebar } from "@/components/dashboard/sidebar";
import { ensureDefaultOrganization } from "@/actions/onboarding";
import { ActionErrorMessage } from "@/components/i18n/action-error-message";
import { loadSidebarUser } from "@/lib/dashboard/load-sidebar-user";
import { getPosthogPublicConfig } from "@/lib/env/posthog-public";
import { getAppLocale } from "@/lib/i18n/app-locale";
import { loadMessagesForLocale } from "@/lib/i18n/app-messages";
import { createClient } from "@/lib/supabase/server";
import { canAccessOrganizationAdminConsole } from "@/lib/auth/platform-admin";

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

  const ensured = await ensureDefaultOrganization();
  if (!ensured.ok) {
    return (
      <div className="min-h-screen bg-background p-6">
        <ActionErrorMessage code={ensured.error} />
      </div>
    );
  }

  const sidebarUser = await loadSidebarUser(supabase, user);

  const { data: prof } = await supabase
    .from("profiles")
    .select("organization_id, role")
    .eq("id", user.id)
    .maybeSingle();

  const ph = getPosthogPublicConfig();
  const showOrganizationHub = canAccessOrganizationAdminConsole(prof?.role);

  const locale = await getAppLocale();
  setRequestLocale(locale);
  const messages = await loadMessagesForLocale(locale);

  return (
    <AppShellIntlProvider locale={locale} messages={messages}>
      <div className="flex min-h-screen">
        <Sidebar
          user={sidebarUser}
          showBilling
          showOrganizationHub={showOrganizationHub}
        />
        <div className="flex-1 ml-[240px]">
          {ph && prof?.organization_id ? (
            <PostHogIdentify
              userId={user.id}
              email={user.email ?? null}
              organizationId={prof.organization_id}
              role={prof.role ?? "viewer"}
            />
          ) : null}
          {children}
        </div>
      </div>
    </AppShellIntlProvider>
  );
}
