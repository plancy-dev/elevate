import { createClient } from "@/lib/supabase/server";

export type OrgAttendeeRow = {
  id: string;
  name: string;
  email: string;
  company: string;
  eventTitle: string;
  registrationLabel: string;
  registrationKey: string;
  checkedIn: boolean;
};

const REG_LABEL: Record<string, string> = {
  general: "General",
  vip: "VIP",
  speaker: "Speaker",
  sponsor: "Sponsor",
  media: "Media",
};

function registrationLabel(key: string): string {
  return REG_LABEL[key] ?? key.replace(/_/g, "");
}

/** Attendees across all events in the organization (by event_id → events.organization_id). */
export async function listOrgAttendeesForOrg(
  organizationId: string,
): Promise<OrgAttendeeRow[]> {
  const supabase = await createClient();

  const { data: eventRows, error: evErr } = await supabase
    .from("events")
    .select("id")
    .eq("organization_id", organizationId);

  if (evErr) throw new Error(evErr.message);

  const eventIds = (eventRows ?? []).map((r) => r.id);
  if (eventIds.length === 0) return [];

  const { data: rows, error } = await supabase
    .from("attendees")
    .select(
      "id, first_name, last_name, email, company, registration_type, checked_in, event_id",
    )
    .in("event_id", eventIds)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) throw new Error(error.message);

  const { data: events } = await supabase
    .from("events")
    .select("id, title")
    .in("id", eventIds);

  const titleByEvent = new Map(
    (events ?? []).map((e) => [e.id, e.title] as const),
  );

  return (rows ?? []).map((r) => {
    const first = (r.first_name ?? "").trim();
    const last = (r.last_name ?? "").trim();
    const name =
      [first, last].filter(Boolean).join("") || r.email || "—";
    const regKey = String(r.registration_type ?? "general");
    return {
      id: r.id,
      name,
      email: r.email,
      company: (r.company ?? "").trim() || "—",
      eventTitle: titleByEvent.get(r.event_id) ?? "—",
      registrationLabel: registrationLabel(regKey),
      registrationKey: regKey,
      checkedIn: Boolean(r.checked_in),
    };
  });
}
