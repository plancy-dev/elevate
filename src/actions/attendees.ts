"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { AuditAction, AuditEntityType } from "@/lib/audit/constants";
import { logAudit } from "@/lib/audit/log";
import { getOrgEditorContext } from "@/lib/auth/require-org-editor";
import { revalidateEventAndDashboard } from "@/lib/cache/revalidate-events";
import { parseCsvRows } from "@/lib/csv-parse";
import { createClient } from "@/lib/supabase/server";

export type AttendeeActionState =
  | { error?: string; success?: string }
  | undefined;

const REG_TYPES = new Set([
  "general",
  "vip",
  "speaker",
  "sponsor",
  "media",
]);

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

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, "_");
}

function findColumn(header: string[], names: string[]): number {
  for (const n of names) {
    const i = header.indexOf(n);
    if (i >= 0) return i;
  }
  return -1;
}

function parseEmail(raw: string): string | null {
  const t = raw.trim().toLowerCase();
  if (!t || !t.includes("@")) return null;
  return t;
}

export async function importAttendeesCsv(
  _prev: AttendeeActionState,
  formData: FormData,
): Promise<AttendeeActionState> {
  const eventId = String(formData.get("event_id") ?? "").trim();
  const file = formData.get("file");
  if (!eventId) return { error: "Select an event." };
  if (!(file instanceof File)) return { error: "Choose a CSV file." };

  const text = await file.text();
  if (text.length > 2_000_000) {
    return { error: "File is too large (max ~2MB)." };
  }

  const supabase = await createClient();
  const auth = await getOrgEditorContext(supabase);
  if (!auth.ok) return { error: auth.error };

  const allowed = await assertEventInOrg(
    supabase,
    eventId,
    auth.ctx.organizationId,
  );
  if (!allowed) return { error: "Event not found or access denied." };

  const rows = parseCsvRows(text);
  if (rows.length === 0) return { error: "The CSV is empty." };

  const header = rows[0].map((h) => normalizeHeader(h));
  const emailIdx = findColumn(header, ["email", "email_address"]);
  if (emailIdx < 0) {
    return { error: 'CSV must include an "email" column.' };
  }

  const firstIdx = findColumn(header, ["first_name", "firstname", "first"]);
  const lastIdx = findColumn(header, ["last_name", "lastname", "last"]);
  const companyIdx = findColumn(header, [
    "company",
    "company_name",
    "organization",
  ]);
  const regIdx = findColumn(header, [
    "registration_type",
    "type",
    "badge",
    "badge_type",
  ]);

  const dataRows = rows
    .slice(1)
    .filter((r) => r.some((c) => String(c).trim() !== ""));
  if (dataRows.length > 2000) {
    return { error: "Too many rows (max 2000 per import)." };
  }

  const toInsert: Array<{
    event_id: string;
    email: string;
    first_name: string;
    last_name: string;
    company: string;
    registration_type:
      | "general"
      | "vip"
      | "speaker"
      | "sponsor"
      | "media";
  }> = [];
  const warnings: string[] = [];

  for (let i = 0; i < dataRows.length; i++) {
    const line = dataRows[i];
    const rawEmail = emailIdx < line.length ? String(line[emailIdx]) : "";
    const email = parseEmail(rawEmail);
    if (!email) {
      warnings.push(`Row ${i + 2}: invalid email`);
      continue;
    }
    const first_name =
      firstIdx >= 0 && firstIdx < line.length
        ? String(line[firstIdx]).trim()
        : "";
    const last_name =
      lastIdx >= 0 && lastIdx < line.length
        ? String(line[lastIdx]).trim()
        : "";
    const company =
      companyIdx >= 0 && companyIdx < line.length
        ? String(line[companyIdx]).trim()
        : "";

    let registration_type:
      | "general"
      | "vip"
      | "speaker"
      | "sponsor"
      | "media" = "general";
    if (regIdx >= 0 && regIdx < line.length) {
      const raw = String(line[regIdx]).trim().toLowerCase();
      if (raw) {
        if (REG_TYPES.has(raw)) {
          registration_type = raw as typeof registration_type;
        } else {
          warnings.push(
            `Row ${i + 2}: unknown registration_type "${raw}" (using general)`,
          );
        }
      }
    }

    toInsert.push({
      event_id: eventId,
      email,
      first_name,
      last_name,
      company,
      registration_type,
    });
  }

  const seenEmail = new Set<string>();
  const deduped: typeof toInsert = [];
  for (const row of toInsert) {
    if (seenEmail.has(row.email)) continue;
    seenEmail.add(row.email);
    deduped.push(row);
  }

  if (deduped.length === 0) {
    const hint =
      warnings.length > 0 ? warnings.slice(0, 8).join(" ") : "No valid rows.";
    return { error: hint };
  }

  const emails = deduped.map((r) => r.email);
  const existing = new Set<string>();
  const batchIn = 200;
  for (let b = 0; b < emails.length; b += batchIn) {
    const chunk = emails.slice(b, b + batchIn);
    const { data: existingRows } = await supabase
      .from("attendees")
      .select("email")
      .eq("event_id", eventId)
      .in("email", chunk);
    for (const r of existingRows ?? []) existing.add(r.email);
  }
  const newOnly = deduped.filter((r) => !existing.has(r.email));
  const skippedDupes = deduped.length - newOnly.length;

  const chunkSize = 100;
  for (let i = 0; i < newOnly.length; i += chunkSize) {
    const slice = newOnly.slice(i, i + chunkSize);
    const { error } = await supabase.from("attendees").insert(slice);
    if (error) return { error: error.message };
  }

  revalidateEventAndDashboard(eventId);

  await logAudit({
    organizationId: auth.ctx.organizationId,
    actorId: auth.ctx.userId,
    action: AuditAction.ATTENDEE_IMPORT,
    entityType: AuditEntityType.ATTENDEE,
    entityId: null,
    metadata: {
      event_id: eventId,
      added: newOnly.length,
      skipped_duplicates: skippedDupes,
    },
  });

  let msg = `Added ${newOnly.length} new attendee(s).`;
  if (skippedDupes > 0) {
    msg += ` Skipped ${skippedDupes} row(s) already registered for this event (same email).`;
  }
  if (warnings.length > 0) {
    msg += ` Notes: ${warnings.slice(0, 5).join(" ")}`;
    if (warnings.length > 5) msg += ` (+${warnings.length - 5} more)`;
  }
  return { success: msg };
}

async function assertAttendeeIdsInOrg(
  supabase: SupabaseClient,
  attendeeIds: string[],
  organizationId: string,
): Promise<boolean> {
  if (attendeeIds.length === 0) return true;
  const { data: atts, error: aErr } = await supabase
    .from("attendees")
    .select("id, event_id")
    .in("id", attendeeIds);
  if (aErr || !atts || atts.length !== attendeeIds.length) return false;

  const eventIds = [...new Set(atts.map((a) => a.event_id))];
  const { data: evs, error: eErr } = await supabase
    .from("events")
    .select("id")
    .in("id", eventIds)
    .eq("organization_id", organizationId);
  if (eErr || !evs) return false;
  const allowed = new Set(evs.map((e) => e.id));
  return atts.every((a) => allowed.has(a.event_id));
}

export async function setAttendeeCheckIn(
  attendeeId: string,
  checkedIn: boolean,
): Promise<AttendeeActionState> {
  const id = attendeeId.trim();
  if (!id) return { error: "Missing attendee." };

  const supabase = await createClient();
  const auth = await getOrgEditorContext(supabase);
  if (!auth.ok) return { error: auth.error };

  const ok = await assertAttendeeIdsInOrg(
    supabase,
    [id],
    auth.ctx.organizationId,
  );
  if (!ok) return { error: "Attendee not found or access denied." };

  const checked_in_at = checkedIn ? new Date().toISOString() : null;
  const { error, data } = await supabase
    .from("attendees")
    .update({ checked_in: checkedIn, checked_in_at })
    .eq("id", id)
    .select("event_id")
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data?.event_id) return { error: "Update failed." };

  await logAudit({
    organizationId: auth.ctx.organizationId,
    actorId: auth.ctx.userId,
    action: AuditAction.ATTENDEE_CHECK_IN,
    entityType: AuditEntityType.ATTENDEE,
    entityId: id,
    metadata: { event_id: data.event_id, checked_in: checkedIn },
  });

  revalidateEventAndDashboard(data.event_id);
  return { success: checkedIn ? "Checked in." : "Check-in cleared." };
}

export async function bulkSetAttendeeCheckIn(
  attendeeIds: string[],
  checkedIn: boolean,
): Promise<AttendeeActionState> {
  const ids = [...new Set(attendeeIds.map((x) => x.trim()).filter(Boolean))];
  if (ids.length === 0) return { error: "No attendees selected." };
  if (ids.length > 500) return { error: "Too many rows selected (max 500)." };

  const supabase = await createClient();
  const auth = await getOrgEditorContext(supabase);
  if (!auth.ok) return { error: auth.error };

  const ok = await assertAttendeeIdsInOrg(
    supabase,
    ids,
    auth.ctx.organizationId,
  );
  if (!ok) return { error: "Some attendees were not found or access denied." };

  const checked_in_at = checkedIn ? new Date().toISOString() : null;
  const { error, data } = await supabase
    .from("attendees")
    .update({ checked_in: checkedIn, checked_in_at })
    .in("id", ids)
    .select("event_id");

  if (error) return { error: error.message };

  const eventIds = [...new Set((data ?? []).map((r) => r.event_id))];
  for (const eid of eventIds) {
    revalidateEventAndDashboard(eid);
  }

  await logAudit({
    organizationId: auth.ctx.organizationId,
    actorId: auth.ctx.userId,
    action: AuditAction.ATTENDEE_BULK_CHECK_IN,
    entityType: AuditEntityType.ATTENDEE,
    entityId: null,
    metadata: {
      count: ids.length,
      checked_in: checkedIn,
      event_ids: eventIds,
    },
  });

  return {
    success: `${ids.length} attendee(s) ${checkedIn ? "checked in" : "unchecked"}.`,
  };
}
