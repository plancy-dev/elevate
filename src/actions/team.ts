"use server";

import { AuditAction, AuditEntityType } from "@/lib/audit/constants";
import { logAudit } from "@/lib/audit/log";
import { getOrgAdminContext } from "@/lib/auth/require-org-editor";
import { ActionErrorCode } from "@/lib/i18n/action-error-codes";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type UserRole = Database["public"]["Enums"]["user_role"];

export type TeamActionState = { error?: string; success?: string } | undefined;

const ASSIGNABLE_ROLES = [
  "viewer",
  "coordinator",
  "organizer",
  "admin",
] as const;

export async function updateMemberRole(
  profileId: string,
  role: string,
): Promise<TeamActionState> {
  const id = profileId.trim();
  if (!id) return { error: ActionErrorCode.teamMissingMember };
  if (!(ASSIGNABLE_ROLES as readonly string[]).includes(role)) {
    return { error: ActionErrorCode.teamInvalidRole };
  }

  const supabase = await createClient();
  const auth = await getOrgAdminContext(supabase);
  if (!auth.ok) return { error: auth.error };

  if (id === auth.ctx.userId) {
    return { error: ActionErrorCode.teamCannotChangeOwnRole };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return { error: ActionErrorCode.teamServerConfig };
  }

  const { data: target, error: tErr } = await admin
    .from("profiles")
    .select("organization_id")
    .eq("id", id)
    .maybeSingle();

  if (tErr || !target?.organization_id) {
    return { error: ActionErrorCode.teamMemberNotFound };
  }

  if (target.organization_id !== auth.ctx.organizationId) {
    return { error: ActionErrorCode.teamNotInOrg };
  }

  const { error } = await admin
    .from("profiles")
    .update({ role: role as UserRole })
    .eq("id", id);

  if (error) return { error: ActionErrorCode.dbError };

  await logAudit({
    organizationId: auth.ctx.organizationId,
    actorId: auth.ctx.userId,
    action: AuditAction.MEMBER_ROLE_UPDATE,
    entityType: AuditEntityType.PROFILE,
    entityId: id,
    metadata: { role },
  });

  revalidatePath("/dashboard/team");
  revalidatePath("/dashboard");
  return { success: ActionErrorCode.teamRoleUpdated };
}
