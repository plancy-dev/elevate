"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { AuditAction, AuditEntityType } from "@/lib/audit/constants";
import { logAudit } from "@/lib/audit/log";
import { getOrgEditorContext } from "@/lib/auth/require-org-editor";
import { revalidateEventAndDashboard } from "@/lib/cache/revalidate-events";
import { createClient } from "@/lib/supabase/server";

export type SessionActionState =
  | { error?: string; success?: boolean }
  | undefined;

function parseDatetimeLocal(raw: string): Date | null {
  const s = raw.trim();
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function assertEventInOrg(
  supabase: SupabaseClient,
  eventId: string,
  organizationId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  return Boolean(data);
}

async function getSessionEventIdIfInOrg(
  supabase: SupabaseClient,
  sessionId: string,
  organizationId: string,
): Promise<{ eventId: string } | null> {
  const { data: session, error } = await supabase
    .from("sessions")
    .select("id, event_id")
    .eq("id", sessionId)
    .maybeSingle();
  if (error || !session) return null;
  const ok = await assertEventInOrg(supabase, session.event_id, organizationId);
  return ok ? { eventId: session.event_id } : null;
}

export async function createSession(
  _prev: SessionActionState,
  formData: FormData,
): Promise<SessionActionState> {
  const eventId = String(formData.get("event_id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const speakerName = String(formData.get("speaker_name") ?? "").trim();
  const speakerTitle = String(formData.get("speaker_title") ?? "").trim();
  const room = String(formData.get("room") ?? "").trim();
  const capacityRaw = Number(formData.get("capacity") ?? 0);
  const capacity =
    Number.isFinite(capacityRaw) && capacityRaw >= 0
      ? Math.floor(capacityRaw)
      : 0;

  if (!eventId) return { error: "Missing event." };
  if (!title) return { error: "Session title is required." };

  const start = parseDatetimeLocal(String(formData.get("start_time") ?? ""));
  const end = parseDatetimeLocal(String(formData.get("end_time") ?? ""));
  if (!start || !end) return { error: "Start and end date/time are required." };
  if (end <= start) return { error: "End must be after start." };

  const supabase = await createClient();
  const auth = await getOrgEditorContext(supabase);
  if (!auth.ok) return { error: auth.error };

  const allowed = await assertEventInOrg(
    supabase,
    eventId,
    auth.ctx.organizationId,
  );
  if (!allowed) return { error: "Event not found or access denied." };

  const { data: created, error } = await supabase
    .from("sessions")
    .insert({
      event_id: eventId,
      title,
      description,
      speaker_name: speakerName,
      speaker_title: speakerTitle,
      room,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      capacity,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  if (created?.id) {
    await logAudit({
      organizationId: auth.ctx.organizationId,
      actorId: auth.ctx.userId,
      action: AuditAction.SESSION_CREATE,
      entityType: AuditEntityType.SESSION,
      entityId: created.id,
      metadata: { event_id: eventId, title },
    });
  }
  revalidateEventAndDashboard(eventId);
  return { success: true };
}

export async function updateSession(
  _prev: SessionActionState,
  formData: FormData,
): Promise<SessionActionState> {
  const sessionId = String(formData.get("session_id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const speakerName = String(formData.get("speaker_name") ?? "").trim();
  const speakerTitle = String(formData.get("speaker_title") ?? "").trim();
  const room = String(formData.get("room") ?? "").trim();
  const capacityRaw = Number(formData.get("capacity") ?? 0);
  const capacity =
    Number.isFinite(capacityRaw) && capacityRaw >= 0
      ? Math.floor(capacityRaw)
      : 0;

  if (!sessionId) return { error: "Missing session." };
  if (!title) return { error: "Session title is required." };

  const start = parseDatetimeLocal(String(formData.get("start_time") ?? ""));
  const end = parseDatetimeLocal(String(formData.get("end_time") ?? ""));
  if (!start || !end) return { error: "Start and end date/time are required." };
  if (end <= start) return { error: "End must be after start." };

  const supabase = await createClient();
  const auth = await getOrgEditorContext(supabase);
  if (!auth.ok) return { error: auth.error };

  const scope = await getSessionEventIdIfInOrg(
    supabase,
    sessionId,
    auth.ctx.organizationId,
  );
  if (!scope) return { error: "Session not found or access denied." };

  const { error } = await supabase
    .from("sessions")
    .update({
      title,
      description,
      speaker_name: speakerName,
      speaker_title: speakerTitle,
      room,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      capacity,
    })
    .eq("id", sessionId);

  if (error) return { error: error.message };
  await logAudit({
    organizationId: auth.ctx.organizationId,
    actorId: auth.ctx.userId,
    action: AuditAction.SESSION_UPDATE,
    entityType: AuditEntityType.SESSION,
    entityId: sessionId,
    metadata: { event_id: scope.eventId, title },
  });
  revalidateEventAndDashboard(scope.eventId);
  return { success: true };
}

export async function deleteSession(formData: FormData) {
  const sessionId = String(formData.get("session_id") ?? "").trim();
  if (!sessionId) return;

  const supabase = await createClient();
  const auth = await getOrgEditorContext(supabase);
  if (!auth.ok) return;

  const scope = await getSessionEventIdIfInOrg(
    supabase,
    sessionId,
    auth.ctx.organizationId,
  );
  if (!scope) return;

  const { error } = await supabase.from("sessions").delete().eq("id", sessionId);
  if (error) return;

  await logAudit({
    organizationId: auth.ctx.organizationId,
    actorId: auth.ctx.userId,
    action: AuditAction.SESSION_DELETE,
    entityType: AuditEntityType.SESSION,
    entityId: sessionId,
    metadata: { event_id: scope.eventId },
  });

  revalidateEventAndDashboard(scope.eventId);
}
