import { createClient } from "@/lib/supabase/server";

export type VenueRow = {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  capacity: number;
};

export async function listVenuesForOrg(organizationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("venues")
    .select("id, name, address, city, country, capacity")
    .eq("organization_id", organizationId)
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as VenueRow[];
}

export async function getVenueByIdForOrg(
  venueId: string,
  organizationId: string,
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("venues")
    .select("id, name, address, city, country, capacity")
    .eq("id", venueId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as VenueRow | null;
}

/** Event counts per venue id for the org (for venue cards). */
export async function countEventsByVenue(organizationId: string) {
  const supabase = await createClient();
  const { data: events, error } = await supabase
    .from("events")
    .select("venue_id")
    .eq("organization_id", organizationId);

  if (error) throw new Error(error.message);

  const counts = new Map<string, number>();
  for (const e of events ?? []) {
    const vid = e.venue_id as string | null;
    if (!vid) continue;
    counts.set(vid, (counts.get(vid) ?? 0) + 1);
  }
  return counts;
}
