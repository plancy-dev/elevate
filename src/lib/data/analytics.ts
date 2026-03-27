import { createClient } from "@/lib/supabase/server";

export type MonthlyRollup = {
  key: string;
  label: string;
  attendees: number;
  revenueCents: number;
};

function monthKey(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Revenue from events by start month; attendee counts from `attendees` rows
 * (registered people), bucketed by parent event `start_date`.
 */
export async function getMonthlyRollupsForOrg(
  organizationId: string,
): Promise<MonthlyRollup[]> {
  const supabase = await createClient();

  const { data: events, error: evErr } = await supabase
    .from("events")
    .select("id, start_date, revenue_cents")
    .eq("organization_id", organizationId);

  if (evErr) throw new Error(evErr.message);

  const buckets = new Map<string, { attendees: number; revenueCents: number }>();

  for (const e of events ?? []) {
    const key = monthKey(e.start_date);
    if (!key) continue;
    const cur = buckets.get(key) ?? { attendees: 0, revenueCents: 0 };
    cur.revenueCents += Number(e.revenue_cents ?? 0);
    buckets.set(key, cur);
  }

  const eventIds = (events ?? []).map((e) => e.id);
  if (eventIds.length > 0) {
    const { data: rows, error: aErr } = await supabase
      .from("attendees")
      .select("event_id, events!inner(start_date, organization_id)")
      .in("event_id", eventIds)
      .eq("events.organization_id", organizationId);

    if (aErr) throw new Error(aErr.message);

    for (const row of rows ?? []) {
      const ev = row.events as { start_date: string };
      const key = monthKey(ev.start_date);
      if (!key) continue;
      const cur = buckets.get(key) ?? { attendees: 0, revenueCents: 0 };
      cur.attendees += 1;
      buckets.set(key, cur);
    }
  }

  const sorted = Array.from(buckets.entries()).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  return sorted.slice(-8).map(([key, v]) => {
    const [y, m] = key.split("-");
    const label = `${y}-${m}`;
    return {
      key,
      label,
      attendees: v.attendees,
      revenueCents: v.revenueCents,
    };
  });
}
