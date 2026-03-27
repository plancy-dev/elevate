import { createClient } from "@/lib/supabase/server";

export type MonthlyRollup = {
  key: string;
  label: string;
  attendees: number;
  revenueCents: number;
};

/** Group events by calendar month (start_date) for simple charts. */
export async function getMonthlyRollupsForOrg(
  organizationId: string,
): Promise<MonthlyRollup[]> {
  const supabase = await createClient();
  const { data: events, error } = await supabase
    .from("events")
    .select("start_date, actual_attendees, revenue_cents")
    .eq("organization_id", organizationId);

  if (error) throw new Error(error.message);

  const buckets = new Map<string, { attendees: number; revenueCents: number }>();

  for (const e of events ?? []) {
    const d = new Date(e.start_date);
    if (Number.isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const cur = buckets.get(key) ?? { attendees: 0, revenueCents: 0 };
    cur.attendees += Number(e.actual_attendees ?? 0);
    cur.revenueCents += Number(e.revenue_cents ?? 0);
    buckets.set(key, cur);
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
