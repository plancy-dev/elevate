import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { SidebarUser } from "@/components/dashboard/sidebar";
import { getInitialsFromDisplayName } from "@/lib/user-display";
import { formatUserRoleLabel } from "@/lib/user-roles";

/**
 * Loads profile + organization name for the dashboard shell (sidebar).
 * Kept in one place so layout stays thin and this can be unit-tested with a mock client later.
 */
export async function loadSidebarUser(
  supabase: SupabaseClient,
  user: User,
): Promise<SidebarUser> {
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

  return {
    displayName,
    email: user.email ?? "",
    roleLabel: formatUserRoleLabel(profile?.role),
    orgName,
    initials: getInitialsFromDisplayName(displayName),
  };
}
