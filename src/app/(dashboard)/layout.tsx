import { redirect } from "next/navigation";
import { Sidebar, type SidebarUser } from "@/components/dashboard/sidebar";
import { createClient } from "@/lib/supabase/server";

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  organizer: "Organizer",
  coordinator: "Coordinator",
  viewer: "Viewer",
};

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
  const roleKey = profile?.role ?? "viewer";
  const sidebarUser: SidebarUser = {
    displayName,
    email: user.email ?? "",
    roleLabel: ROLE_LABEL[roleKey] ?? roleKey,
    orgName,
    initials: (() => {
      const parts = displayName.trim().split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        return `${parts[0]!.slice(0, 1)}${parts[1]!.slice(0, 1)}`.toUpperCase();
      }
      return displayName.slice(0, 2).toUpperCase() || "?";
    })(),
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar user={sidebarUser} />
      <div className="flex-1 ml-[240px]">{children}</div>
    </div>
  );
}
