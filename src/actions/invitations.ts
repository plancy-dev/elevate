"use server";

import { AuditAction, AuditEntityType } from "@/lib/audit/constants";
import { logAudit } from "@/lib/audit/log";
import { getOrgInviteManagerContext } from "@/lib/auth/require-org-editor";
import { ActionErrorCode } from "@/lib/i18n/action-error-codes";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type UserRole = Database["public"]["Enums"]["user_role"];

export type InvitationActionState =
  | { error?: string; success?: string }
  | undefined;

const INVITE_TTL_DAYS = 14;

export async function createOrganizationInvitation(
  _prev: InvitationActionState,
  formData: FormData,
): Promise<InvitationActionState> {
  const emailRaw = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "viewer").trim();

  const allowedRoles = ["viewer", "coordinator", "organizer", "admin"] as const;
  if (!emailRaw || !emailRaw.includes("@")) {
    return { error: ActionErrorCode.inviteInvalidEmail };
  }
  if (!(allowedRoles as readonly string[]).includes(role)) {
    return { error: ActionErrorCode.inviteInvalidRole };
  }

  const supabase = await createClient();
  const auth = await getOrgInviteManagerContext(supabase);
  if (!auth.ok) return { error: auth.error };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: ActionErrorCode.inviteNotAuthenticated };

  const { data: existingMember } = await supabase
    .from("profiles")
    .select("id")
    .eq("organization_id", auth.ctx.organizationId)
    .eq("email", emailRaw)
    .maybeSingle();
  if (existingMember) {
    return { error: ActionErrorCode.inviteEmailAlreadyMember };
  }

  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITE_TTL_DAYS);

  const { data: invRow, error } = await supabase
    .from("organization_invitations")
    .insert({
      organization_id: auth.ctx.organizationId,
      email: emailRaw,
      role: role as UserRole,
      token,
      invited_by: user.id,
      expires_at: expiresAt.toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        error: ActionErrorCode.invitePendingDuplicate,
      };
    }
    return { error: ActionErrorCode.dbError };
  }

  if (invRow?.id) {
    await logAudit({
      organizationId: auth.ctx.organizationId,
      actorId: auth.ctx.userId,
      action: AuditAction.INVITE_CREATE,
      entityType: AuditEntityType.INVITATION,
      entityId: invRow.id,
      metadata: { email: emailRaw, role },
    });
  }

  revalidatePath("/dashboard/team");
  return {
    success: ActionErrorCode.inviteCreated,
  };
}

export async function revokeOrganizationInvitation(
  invitationId: string,
): Promise<InvitationActionState> {
  const id = invitationId.trim();
  if (!id) return { error: ActionErrorCode.inviteMissingId };

  const supabase = await createClient();
  const auth = await getOrgInviteManagerContext(supabase);
  if (!auth.ok) return { error: auth.error };

  const { error } = await supabase
    .from("organization_invitations")
    .delete()
    .eq("id", id)
    .eq("organization_id", auth.ctx.organizationId);

  if (error) return { error: ActionErrorCode.dbError };

  await logAudit({
    organizationId: auth.ctx.organizationId,
    actorId: auth.ctx.userId,
    action: AuditAction.INVITE_REVOKE,
    entityType: AuditEntityType.INVITATION,
    entityId: id,
    metadata: {},
  });

  revalidatePath("/dashboard/team");
  return { success: ActionErrorCode.inviteRevoked };
}
