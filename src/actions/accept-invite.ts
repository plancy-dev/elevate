"use server";

import { AuditAction, AuditEntityType } from "@/lib/audit/constants";
import { logAudit } from "@/lib/audit/log";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type AcceptInviteResult =
  | { ok: true; organizationId: string }
  | { ok: false; error: string };

/**
 * Accept a pending invitation by token (signed-in user email must match).
 */
export async function acceptInvitationByToken(
  token: string,
): Promise<AcceptInviteResult> {
  const t = token.trim();
  if (!t) return { ok: false, error: "Missing invitation token." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return { ok: false, error: "Sign in to accept this invitation." };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return {
      ok: false,
      error:
        "Server configuration error. Ask an admin to check SUPABASE_SERVICE_ROLE_KEY.",
    };
  }

  const email = user.email.trim().toLowerCase();

  const { data: inv, error: invErr } = await admin
    .from("organization_invitations")
    .select("id, organization_id, role, email")
    .eq("token", t)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (invErr || !inv) {
    return { ok: false, error: "This invitation is invalid or has expired." };
  }

  if (inv.email.trim().toLowerCase() !== email) {
    return {
      ok: false,
      error: "Sign in with the email address this invitation was sent to.",
    };
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .maybeSingle();

  if (
    profile?.organization_id &&
    profile.organization_id !== inv.organization_id
  ) {
    return {
      ok: false,
      error:
        "You already belong to another organization. Contact support to switch.",
    };
  }

  const { error: upErr } = await admin
    .from("profiles")
    .update({
      organization_id: inv.organization_id,
      role: inv.role,
    })
    .eq("id", user.id);

  if (upErr) return { ok: false, error: upErr.message };

  await admin
    .from("organization_invitations")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", inv.id);

  await logAudit({
    organizationId: inv.organization_id,
    actorId: user.id,
    action: AuditAction.INVITE_ACCEPT,
    entityType: AuditEntityType.INVITATION,
    entityId: inv.id,
    metadata: { email: inv.email, role: inv.role },
  });

  return { ok: true, organizationId: inv.organization_id };
}
