"use server";

import { AuditAction, AuditEntityType } from "@/lib/audit/constants";
import { logAudit } from "@/lib/audit/log";
import { revalidatePath } from "next/cache";
import { getVenueManagerContext } from "@/lib/auth/require-org-editor";
import {
  validateDisplayName,
  validateOrganizationName,
} from "@/lib/settings-validation";
import { createClient } from "@/lib/supabase/server";

export type SettingsActionState = { error?: string } | undefined;

export async function updateOrganizationName(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const raw = String(formData.get("organization_name") ?? "");
  const v = validateOrganizationName(raw);
  if (!v.ok) return { error: v.error };

  const supabase = await createClient();
  const auth = await getVenueManagerContext(supabase);
  if (!auth.ok) return { error: auth.error };

  const { error } = await supabase
    .from("organizations")
    .update({ name: v.value })
    .eq("id", auth.ctx.organizationId);

  if (error) return { error: error.message };

  await logAudit({
    organizationId: auth.ctx.organizationId,
    actorId: auth.ctx.userId,
    action: AuditAction.SETTINGS_ORG_UPDATE,
    entityType: AuditEntityType.ORGANIZATION,
    entityId: auth.ctx.organizationId,
    metadata: { name: v.value },
  });

  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/settings");
  return undefined;
}

export async function updateProfileAndNotifications(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const rawName = String(formData.get("display_name") ?? "");
  const nameCheck = validateDisplayName(rawName);
  if (!nameCheck.ok) return { error: nameCheck.error };

  const digest =
    formData.get("email_milestone_digest") === "on" ||
    formData.get("email_milestone_digest") === "true";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: nameCheck.value,
      email_milestone_digest: digest,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  const { data: prof } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .maybeSingle();

  if (prof?.organization_id) {
    await logAudit({
      organizationId: prof.organization_id,
      actorId: user.id,
      action: AuditAction.SETTINGS_PROFILE_UPDATE,
      entityType: AuditEntityType.PROFILE,
      entityId: user.id,
      metadata: {
        display_name: nameCheck.value,
        email_milestone_digest: digest,
      },
    });
  }

  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/settings");
  return undefined;
}
