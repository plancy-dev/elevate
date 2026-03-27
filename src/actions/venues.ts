"use server";

import { redirect } from "next/navigation";
import { AuditAction, AuditEntityType } from "@/lib/audit/constants";
import { logAudit } from "@/lib/audit/log";
import { getVenueManagerContext } from "@/lib/auth/require-org-editor";
import { revalidateEventAndDashboard } from "@/lib/cache/revalidate-events";
import { createClient } from "@/lib/supabase/server";

export type VenueFormState = { error?: string } | undefined;

export async function createVenue(
  _prev: VenueFormState,
  formData: FormData,
): Promise<VenueFormState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Name is required" };

  const supabase = await createClient();
  const auth = await getVenueManagerContext(supabase);
  if (!auth.ok) return { error: auth.error };

  const { data: created, error } = await supabase
    .from("venues")
    .insert({
      organization_id: auth.ctx.organizationId,
      name,
      address: String(formData.get("address") ?? ""),
      city: String(formData.get("city") ?? ""),
      country: String(formData.get("country") ?? ""),
      capacity: Number(formData.get("capacity") ?? 0) || 0,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  if (created?.id) {
    await logAudit({
      organizationId: auth.ctx.organizationId,
      actorId: auth.ctx.userId,
      action: AuditAction.VENUE_CREATE,
      entityType: AuditEntityType.VENUE,
      entityId: created.id,
      metadata: { name },
    });
  }

  revalidateEventAndDashboard();
  redirect("/dashboard/venues");
}

export async function updateVenue(
  _prev: VenueFormState,
  formData: FormData,
): Promise<VenueFormState> {
  const venueId = String(formData.get("venue_id") ?? "").trim();
  if (!venueId) return { error: "Missing venue" };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Name is required" };

  const supabase = await createClient();
  const auth = await getVenueManagerContext(supabase);
  if (!auth.ok) return { error: auth.error };

  const { error } = await supabase
    .from("venues")
    .update({
      name,
      address: String(formData.get("address") ?? ""),
      city: String(formData.get("city") ?? ""),
      country: String(formData.get("country") ?? ""),
      capacity: Number(formData.get("capacity") ?? 0) || 0,
    })
    .eq("id", venueId)
    .eq("organization_id", auth.ctx.organizationId);

  if (error) return { error: error.message };

  await logAudit({
    organizationId: auth.ctx.organizationId,
    actorId: auth.ctx.userId,
    action: AuditAction.VENUE_UPDATE,
    entityType: AuditEntityType.VENUE,
    entityId: venueId,
    metadata: { name },
  });

  revalidateEventAndDashboard();
  redirect("/dashboard/venues");
}

export async function deleteVenue(formData: FormData) {
  const venueId = String(formData.get("venue_id") ?? "").trim();
  if (!venueId) return;

  const supabase = await createClient();
  const auth = await getVenueManagerContext(supabase);
  if (!auth.ok) return;

  const { error } = await supabase
    .from("venues")
    .delete()
    .eq("id", venueId)
    .eq("organization_id", auth.ctx.organizationId);

  if (error) return;

  await logAudit({
    organizationId: auth.ctx.organizationId,
    actorId: auth.ctx.userId,
    action: AuditAction.VENUE_DELETE,
    entityType: AuditEntityType.VENUE,
    entityId: venueId,
    metadata: {},
  });

  revalidateEventAndDashboard();
  redirect("/dashboard/venues");
}
