import { createClient } from "@/lib/supabase/server";

export type OrgMemberRow = {
  id: string;
  email: string;
  displayName: string;
  role: string;
  createdAt: string;
};

export type OrgInvitationRow = {
  id: string;
  email: string;
  role: string;
  token: string;
  expiresAt: string;
  createdAt: string;
};

export async function listOrgMembers(
  organizationId: string,
): Promise<OrgMemberRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, display_name, role, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((r) => ({
    id: r.id,
    email: r.email,
    displayName: (r.display_name ?? "").trim() || r.email,
    role: r.role,
    createdAt: r.created_at,
  }));
}

export async function listPendingInvitations(
  organizationId: string,
): Promise<OrgInvitationRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_invitations")
    .select("id, email, role, token, expires_at, created_at")
    .eq("organization_id", organizationId)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((r) => ({
    id: r.id,
    email: r.email,
    role: r.role,
    token: r.token,
    expiresAt: r.expires_at,
    createdAt: r.created_at,
  }));
}
