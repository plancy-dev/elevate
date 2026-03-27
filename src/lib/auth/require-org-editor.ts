import type { SupabaseClient } from "@supabase/supabase-js";

/** Roles that may create/update/delete org-scoped operational data (events, sessions, etc.). */
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

/** Invitations: same as venue policy (admin | organizer). */
const INVITE_MANAGER_ROLES = ["admin", "organizer"] as const;

export async function getOrgInviteManagerContext(
  supabase: SupabaseClient,
): Promise<
  { ok: true; ctx: OrgEditorContext } | { ok: false; error: string }
> {
  const base = await getOrgEditorContext(supabase);
  if (!base.ok) return base;
  if (!(INVITE_MANAGER_ROLES as readonly string[]).includes(base.ctx.role)) {
    return {
      ok: false,
      error: "Only admins and organizers can manage invitations.",
    };
  }
  return base;
}

/** Org admin only — changing member roles. */
export async function getOrgAdminContext(
  supabase: SupabaseClient,
): Promise<
  { ok: true; ctx: OrgEditorContext } | { ok: false; error: string }
> {
  const base = await getOrgEditorContext(supabase);
  if (!base.ok) return base;
  if (base.ctx.role !== "admin") {
    return { ok: false, error: "Only organization admins can change member roles." };
  }
  return base;
}

/** Venues RLS allows only admin | organizer (not coordinator). */
const VENUE_MANAGER_ROLES = ["admin", "organizer"] as const;

export async function getVenueManagerContext(
  supabase: SupabaseClient,
): Promise<
  { ok: true; ctx: OrgEditorContext } | { ok: false; error: string }
> {
  const base = await getOrgEditorContext(supabase);
  if (!base.ok) return base;
  if (!(VENUE_MANAGER_ROLES as readonly string[]).includes(base.ctx.role)) {
    return { ok: false, error: "Insufficient permissions for venue management" };
  }
  return base;
}
