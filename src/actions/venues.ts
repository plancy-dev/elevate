"use server";

import { redirect } from "next/navigation";
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

  const { error } = await supabase.from("venues").insert({
    organization_id: auth.ctx.organizationId,
    name,
    address: String(formData.get("address") ?? ""),
    city: String(formData.get("city") ?? ""),
    country: String(formData.get("country") ?? ""),
    capacity: Number(formData.get("capacity") ?? 0) || 0,
  });

  if (error) return { error: error.message };

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

  revalidateEventAndDashboard();
  redirect("/dashboard/venues");
}
