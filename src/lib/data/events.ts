import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { EventStatus } from "@/types";

export const EVENT_STATUS_LABEL: Record<EventStatus, string> = {
  draft: "Draft",
  planning: "Planning",
  registration_open: "Registration Open",
  live: "Live",
  completed: "Completed",
  cancelled: "Cancelled",
};

/** Tailwind classes for status pills (aligned with mock dashboard palette). */
export const EVENT_STATUS_BADGE_CLASS: Record<EventStatus, string> = {
  draft: "bg-[#262626] text-text-tertiary",
  planning: "bg-[#393939] text-text-secondary",
  registration_open: "bg-[#0043CE]/20 text-info",
  live: "bg-[#198038]/20 text-accent",
  completed: "bg-[#161616] text-text-tertiary",
  cancelled: "bg-danger/20 text-danger",
};

export type EventListRow = {
  id: string;
  title: string;
  slug: string;
  status: EventStatus;
  event_type: string;
  start_date: string;
  end_date: string;
  expected_attendees: number;
  actual_attendees: number;
  revenue_cents: number;
  currency: string;
  venue: { name: string; city: string; country: string } | null;
};

export function formatEventDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return "—";
  if (s.toDateString() === e.toDateString()) return formatDate(s);
  return `${formatDate(s)} – ${formatDate(e)}`;
}

export function eventTypeLabel(t: string): string {
  return t.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
}

export async function listOrgEvents(organizationId: string): Promise<EventListRow[]> {
  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("events")
    .select(
      "id, title, slug, status, event_type, start_date, end_date, expected_attendees, actual_attendees, revenue_cents, currency, venue_id",
    )
    .eq("organization_id", organizationId)
    .order("start_date", { ascending: false });

  if (error) throw new Error(error.message);

  const events = rows ?? [];
  const venueIds = [
    ...new Set(events.map((e) => e.venue_id).filter(Boolean)),
  ] as string[];

  let venueMap = new Map<
    string,
    { name: string; city: string; country: string }
  >();
  if (venueIds.length > 0) {
    const { data: venues } = await supabase
      .from("venues")
      .select("id, name, city, country")
      .in("id", venueIds);
    venueMap = new Map(
      (venues ?? []).map((v) => [
        v.id,
        { name: v.name, city: v.city, country: v.country },
      ]),
    );
  }

  return events.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    status: row.status as EventStatus,
    event_type: row.event_type,
    start_date: row.start_date,
    end_date: row.end_date,
    expected_attendees: row.expected_attendees ?? 0,
    actual_attendees: row.actual_attendees ?? 0,
    revenue_cents: Number(row.revenue_cents ?? 0),
    currency: row.currency ?? "USD",
    venue: row.venue_id ? venueMap.get(row.venue_id) ?? null : null,
  }));
}

export type DashboardStats = {
  totalAttendees: number;
  revenueCents: number;
  activeEvents: number;
  totalEvents: number;
};

export async function getDashboardStats(organizationId: string) {
  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("events")
    .select("actual_attendees, revenue_cents, status")
    .eq("organization_id", organizationId);

  if (error) throw new Error(error.message);

  const list = rows ?? [];
  const totalAttendees = list.reduce((s, r) => s + (r.actual_attendees ?? 0), 0);
  const revenueCents = list.reduce((s, r) => s + Number(r.revenue_cents ?? 0), 0);
  const activeEvents = list.filter((r) =>
    ["live", "registration_open"].includes(r.status as string),
  ).length;

  return {
    totalAttendees,
    revenueCents,
    activeEvents,
    totalEvents: list.length,
  } satisfies DashboardStats;
}

export type EventDetailPageData = {
  event: {
    id: string;
    title: string;
    description: string;
    event_type: string;
    status: EventStatus;
    start_date: string;
    end_date: string;
    timezone: string;
    expected_attendees: number;
    actual_attendees: number;
    budget_cents: number;
    revenue_cents: number;
    currency: string;
  };
  locationLabel: string;
  sessions: Array<{
    id: string;
    timeLabel: string;
    title: string;
    speaker_line: string;
    room: string;
    registered_count: number;
    capacity: number;
  }>;
  topAttendees: Array<{
    id: string;
    name: string;
    company: string;
    type: string;
    typeKey: string;
    checked_in: boolean;
  }>;
  registeredCount: number;
  checkedInCount: number;
  npsAvg: number | null;
};

function formatSessionTime(start: string, end: string): string {
  const o = { hour: "2-digit", minute: "2-digit" } as const;
  const a = new Date(start);
  const b = new Date(end);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return "—";
  return `${a.toLocaleTimeString("en-US", o)} – ${b.toLocaleTimeString("en-US", o)}`;
}

export async function getEventDetailPageData(
  eventId: string,
): Promise<EventDetailPageData | null> {
  const supabase = await createClient();
  const { data: event, error: evErr } = await supabase
    .from("events")
    .select(
      "id, title, description, event_type, status, venue_id, start_date, end_date, timezone, expected_attendees, actual_attendees, budget_cents, revenue_cents, currency",
    )
    .eq("id", eventId)
    .maybeSingle();

  if (evErr || !event) return null;

  let locationLabel = "Venue TBD";
  if (event.venue_id) {
    const { data: venue } = await supabase
      .from("venues")
      .select("name, city, country")
      .eq("id", event.venue_id)
      .maybeSingle();
    if (venue) {
      const parts = [venue.name, venue.city, venue.country].filter(Boolean);
      locationLabel = parts.join(", ");
    }
  }

  const { data: sessionRows } = await supabase
    .from("sessions")
    .select(
      "id, start_time, end_time, title, speaker_name, speaker_title, room, registered_count, capacity",
    )
    .eq("event_id", eventId)
    .order("start_time", { ascending: true });

  const sessions = (sessionRows ?? []).map((s) => {
    const speakerParts = [s.speaker_name, s.speaker_title].filter(Boolean);
    return {
      id: s.id,
      start_time: s.start_time,
      end_time: s.end_time,
      title: s.title,
      speaker_line: speakerParts.join(", ") || "—",
      room: s.room || "—",
      registered_count: s.registered_count ?? 0,
      capacity: s.capacity ?? 0,
      timeLabel: formatSessionTime(s.start_time, s.end_time),
    };
  });

  const { data: attRows } = await supabase
    .from("attendees")
    .select(
      "id, first_name, last_name, company, registration_type, checked_in, nps_score",
    )
    .eq("event_id", eventId)
    .order("created_at", { ascending: false })
    .limit(8);

  const { count: registeredCount } = await supabase
    .from("attendees")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId);

  const { count: checkedInCount } = await supabase
    .from("attendees")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId)
    .eq("checked_in", true);

  const { data: npsRows } = await supabase
    .from("attendees")
    .select("nps_score")
    .eq("event_id", eventId)
    .not("nps_score", "is", null);

  const npsScores = (npsRows ?? [])
    .map((r) => r.nps_score)
    .filter((n): n is number => n != null);
  const npsAvg =
    npsScores.length > 0
      ? Math.round(
          npsScores.reduce((a, b) => a + b, 0) / npsScores.length,
        )
      : null;

  const topAttendees = (attRows ?? []).map((a) => {
    const name = [a.first_name, a.last_name].filter(Boolean).join(" ") || "—";
    const rt = a.registration_type;
    const typeLabel =
      rt === "vip"
        ? "VIP"
        : rt.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
    return {
      id: a.id,
      name,
      company: a.company || "—",
      type: typeLabel,
      typeKey: rt,
      checked_in: a.checked_in,
    };
  });

  return {
    event: {
      id: event.id,
      title: event.title,
      description: event.description || "",
      event_type: event.event_type,
      status: event.status as EventStatus,
      start_date: event.start_date,
      end_date: event.end_date,
      timezone: event.timezone,
      expected_attendees: event.expected_attendees ?? 0,
      actual_attendees: event.actual_attendees ?? 0,
      budget_cents: Number(event.budget_cents ?? 0),
      revenue_cents: Number(event.revenue_cents ?? 0),
      currency: event.currency ?? "USD",
    },
    locationLabel,
    sessions,
    topAttendees,
    registeredCount: registeredCount ?? 0,
    checkedInCount: checkedInCount ?? 0,
    npsAvg,
  };
}

export function formatEventRevenue(row: EventListRow): string {
  if (row.revenue_cents <= 0) return formatCurrency(0, row.currency);
  return formatCurrency(row.revenue_cents, row.currency);
}

/** Single event row for edit form (RLS-scoped). */
export async function getEventByIdForEdit(eventId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select(
      "id, title, description, event_type, status, start_date, end_date, timezone, expected_attendees, venue_id",
    )
    .eq("id", eventId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}
