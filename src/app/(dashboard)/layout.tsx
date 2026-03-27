import { redirect } from "next/navigation";
import { PostHogIdentify } from "@/components/analytics/posthog-identify";
import { Sidebar } from "@/components/dashboard/sidebar";
import { ensureDefaultOrganization } from "@/actions/onboarding";
import { loadSidebarUser } from "@/lib/dashboard/load-sidebar-user";
import { getPosthogPublicConfig } from "@/lib/env/posthog-public";
import { createClient } from "@/lib/supabase/server";

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
        <p className="text-sm text-danger">{ensured.error}</p>
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
  const showAudit = prof?.role === "admin";

  return (
    <div className="flex min-h-screen">
      <Sidebar user={sidebarUser} showAudit={showAudit} showBilling />
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
  );
}
