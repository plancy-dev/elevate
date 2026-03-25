import type { SupabaseClient } from "@supabase/supabase-js";

/** Roles that may create/update/delete org-scoped operational data (events, venues, etc.). */
export const ORG_EDITOR_ROLES = ["admin", "organizer", "coordinator"] as const;

export type OrgEditorContext = {
  userId: string;
  organizationId: string;
  role: string;
};

/**
 * Resolves the current user as an org-bound editor (admin | organizer | coordinator).
 * Use in server actions that mirror RLS expectations for `events`, `sessions`, etc.
 */
export async function getOrgEditorContext(
  supabase: SupabaseClient,
): Promise<
  { ok: true; ctx: OrgEditorContext } | { ok: false; error: string }
> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (error) return { ok: false, error: error.message };
  if (!profile?.organization_id) {
    return { ok: false, error: "No organization. Refresh the page." };
  }

  const role = profile.role ?? "";
  if (!(ORG_EDITOR_ROLES as readonly string[]).includes(role)) {
    return { ok: false, error: "Insufficient permissions" };
  }

  return {
    ok: true,
    ctx: {
      userId: user.id,
      organizationId: profile.organization_id,
      role,
    },
  };
}
