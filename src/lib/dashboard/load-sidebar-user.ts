import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { SidebarUser } from "@/components/dashboard/sidebar";
import { getInitialsFromDisplayName } from "@/lib/user-display";
import { normalizeOrgRoleKey } from "@/lib/user-roles";

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
    .select(
      `
      display_name,
      role,
      organization_id,
      organizations (
        name
      )
    `,
    )
    .eq("id", user.id)
    .maybeSingle();

  type ProfileWithOrgEmbed = {
    display_name?: string | null;
    role?: string;
    organization_id?: string | null;
    organizations?: { name?: string | null } | null;
  };

  const row = profile as ProfileWithOrgEmbed | null;
  const orgName = row?.organizations?.name?.trim() || "—";

  const displayName =
    row?.display_name?.trim() ||
    user.email?.split("@")[0] ||
    "User";

  return {
    displayName,
    email: user.email ?? "",
    role: normalizeOrgRoleKey(row?.role),
    orgName,
    initials: getInitialsFromDisplayName(displayName),
  };
}
