"use server";

import { redirect } from "next/navigation";
import { getOrgEditorContext } from "@/lib/auth/require-org-editor";
import { revalidateEventAndDashboard } from "@/lib/cache/revalidate-events";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

export type CreateEventState = { error?: string } | undefined;

export async function createEvent(
  _prev: CreateEventState,
  formData: FormData,
): Promise<CreateEventState> {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Title is required" };

  const supabase = await createClient();
  const auth = await getOrgEditorContext(supabase);
  if (!auth.ok) return { error: auth.error };

  const { ctx } = auth;
  const base = slugify(title) || "event";
  const slug = `${base}-${crypto.randomUUID().slice(0, 8)}`;

  const start = String(formData.get("start_date") ?? "");
  const end = String(formData.get("end_date") ?? "");
  if (!start || !end) return { error: "Start and end dates are required" };

  const venueRaw = String(formData.get("venue_id") ?? "").trim();
  const venueCandidate: string | null =
    venueRaw.length > 0 ? venueRaw : null;
  if (venueCandidate) {
    const { data: v } = await supabase
      .from("venues")
      .select("id")
      .eq("id", venueCandidate)
      .eq("organization_id", ctx.organizationId)
      .maybeSingle();
    if (!v) return { error: "Invalid or inaccessible venue" };
  }
  const venueId = venueCandidate;

  const { data: created, error } = await supabase
    .from("events")
    .insert({
      organization_id: ctx.organizationId,
      title,
      slug,
      description: String(formData.get("description") ?? ""),
      event_type: String(formData.get("event_type") ?? "conference"),
      status: "draft",
      start_date: new Date(start).toISOString(),
      end_date: new Date(end).toISOString(),
      timezone: String(formData.get("timezone") ?? "UTC"),
      expected_attendees: Number(formData.get("expected_attendees") ?? 0) || 0,
      created_by: ctx.userId,
      venue_id: venueId,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  if (!created) return { error: "Failed to create event" };

  revalidateEventAndDashboard(created.id);
  redirect(`/dashboard/events/${created.id}`);
}

export type UpdateEventState = { error?: string } | undefined;

export async function updateEvent(
  _prev: UpdateEventState,
  formData: FormData,
): Promise<UpdateEventState> {
  const eventId = String(formData.get("event_id") ?? "").trim();
  if (!eventId) return { error: "Missing event" };

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Title is required" };

  const supabase = await createClient();
  const auth = await getOrgEditorContext(supabase);
  if (!auth.ok) return { error: auth.error };

  const { ctx } = auth;
  const start = String(formData.get("start_date") ?? "");
  const end = String(formData.get("end_date") ?? "");
  if (!start || !end) return { error: "Start and end dates are required" };

  const status = String(formData.get("status") ?? "draft");
  const venueRaw = String(formData.get("venue_id") ?? "").trim();
  const venueCandidate: string | null =
    venueRaw.length > 0 ? venueRaw : null;
  if (venueCandidate) {
    const { data: v } = await supabase
      .from("venues")
      .select("id")
      .eq("id", venueCandidate)
      .eq("organization_id", ctx.organizationId)
      .maybeSingle();
    if (!v) return { error: "Invalid or inaccessible venue" };
  }
  const venueId = venueCandidate;

  const { error } = await supabase
    .from("events")
    .update({
      title,
      description: String(formData.get("description") ?? ""),
      event_type: String(formData.get("event_type") ?? "conference"),
      status: status as
        | "draft"
        | "planning"
        | "registration_open"
        | "live"
        | "completed"
        | "cancelled",
      start_date: new Date(start).toISOString(),
      end_date: new Date(end).toISOString(),
      timezone: String(formData.get("timezone") ?? "UTC"),
      expected_attendees: Number(formData.get("expected_attendees") ?? 0) || 0,
      venue_id: venueId,
    })
    .eq("id", eventId)
    .eq("organization_id", ctx.organizationId);

  if (error) return { error: error.message };

  revalidateEventAndDashboard(eventId);
  redirect(`/dashboard/events/${eventId}`);
}

export async function deleteEvent(formData: FormData) {
  const eventId = String(formData.get("event_id") ?? "").trim();
  if (!eventId) return;

  const supabase = await createClient();
  const auth = await getOrgEditorContext(supabase);
  if (!auth.ok) return;

  const { ctx } = auth;
  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", eventId)
    .eq("organization_id", ctx.organizationId);

  if (error) return;

  revalidateEventAndDashboard();
  redirect("/dashboard/events");
}
