import { redirect } from "next/navigation";
import { ensureDefaultOrganization } from "@/actions/onboarding";
import { Sidebar, type SidebarUser } from "@/components/dashboard/sidebar";
import { getInitialsFromDisplayName } from "@/lib/user-display";
import { formatUserRoleLabel } from "@/lib/user-roles";
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
  if (!ensured.ok && ensured.error === "Not authenticated") {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role, organization_id")
    .eq("id", user.id)
    .maybeSingle();

  let orgName = "—";
  if (profile?.organization_id) {
    const { data: org } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", profile.organization_id)
      .maybeSingle();
    orgName = org?.name?.trim() || "—";
  }

  const displayName =
    profile?.display_name?.trim() ||
    user.email?.split("@")[0] ||
    "User";
  const sidebarUser: SidebarUser = {
    displayName,
    email: user.email ?? "",
    roleLabel: formatUserRoleLabel(profile?.role),
    orgName,
    initials: getInitialsFromDisplayName(displayName),
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar user={sidebarUser} />
      <div className="flex-1 ml-[240px]">{children}</div>
    </div>
  );
}
