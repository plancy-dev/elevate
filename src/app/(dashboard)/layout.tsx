import { redirect } from "next/navigation";
import { ensureDefaultOrganization } from "@/actions/onboarding";
import { Sidebar } from "@/components/dashboard/sidebar";
import { loadSidebarUser } from "@/lib/dashboard/load-sidebar-user";
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

  const sidebarUser = await loadSidebarUser(supabase, user);

  return (
    <div className="flex min-h-screen">
      <Sidebar user={sidebarUser} />
      <div className="flex-1 ml-[240px]">{children}</div>
    </div>
  );
}
