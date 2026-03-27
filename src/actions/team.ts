"use server";

import { AuditAction, AuditEntityType } from "@/lib/audit/constants";
import { logAudit } from "@/lib/audit/log";
import { getOrgAdminContext } from "@/lib/auth/require-org-editor";
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
  if (!id) return { error: "Missing member." };
  if (!(ASSIGNABLE_ROLES as readonly string[]).includes(role)) {
    return { error: "Invalid role." };
  }

  const supabase = await createClient();
  const auth = await getOrgAdminContext(supabase);
  if (!auth.ok) return { error: auth.error };

  if (id === auth.ctx.userId) {
    return { error: "You cannot change your own role here." };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return { error: "Server configuration error." };
  }

  const { data: target, error: tErr } = await admin
    .from("profiles")
    .select("organization_id")
    .eq("id", id)
    .maybeSingle();

  if (tErr || !target?.organization_id) {
    return { error: "Member not found." };
  }

  if (target.organization_id !== auth.ctx.organizationId) {
    return { error: "Not a member of your organization." };
  }

  const { error } = await admin
    .from("profiles")
    .update({ role: role as UserRole })
    .eq("id", id);

  if (error) return { error: error.message };

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
  return { success: "Role updated." };
}
