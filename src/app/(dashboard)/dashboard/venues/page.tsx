import Link from "next/link";
import { MapPin, Plus } from "lucide-react";
import { ensureDefaultOrganization } from "@/actions/onboarding";
import { DeleteVenueForm } from "@/components/dashboard/delete-venue-form";
import { ButtonLink } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import {
  countEventsByVenue,
  listVenuesForOrg,
} from "@/lib/data/venues";

export const metadata = { title: "Venues" };

export default async function VenuesPage() {
  const ensured = await ensureDefaultOrganization();
  if (!ensured.ok) {
    return (
      <div className="min-h-screen bg-background p-6">
        <p className="text-sm text-danger">{ensured.error}</p>
      </div>
    );
  }

  const orgId = ensured.organizationId;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const canManage =
    profile?.role === "admin" || profile?.role === "organizer";

  const [venues, eventCounts] = await Promise.all([
    listVenuesForOrg(orgId),
    countEventsByVenue(orgId),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border-subtle bg-background px-6 h-12">
        <h1 className="text-sm font-medium text-text-primary">Venues</h1>
        {canManage ? (
          <ButtonLink href="/dashboard/venues/new" variant="primary" size="sm">
            <Plus className="h-3.5 w-3.5" />
            Add venue
          </ButtonLink>
        ) : (
          <span className="text-xs text-text-tertiary">
            View only — organizer or admin can add venues
          </span>
        )}
      </div>

      <div className="p-6">
        {venues.length === 0 ? (
          <div className="border border-border-subtle bg-layer-01 px-6 py-12 text-center text-sm text-text-tertiary">
            No venues yet.
            {canManage ? (
              <>
                {" "}
                <Link
                  href="/dashboard/venues/new"
                  className="text-interactive hover:text-primary"
                >
                  Add your first venue
                </Link>
                .
              </>
            ) : null}
          </div>
        ) : (
          <div className="grid gap-px bg-border-subtle border border-border-subtle md:grid-cols-2 lg:grid-cols-3">
            {venues.map((v) => (
              <div
                key={v.id}
                className="bg-layer-01 p-5 hover:bg-layer-02 transition-colors flex flex-col"
              >
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/dashboard/venues/${v.id}/edit`}
                    className="text-sm font-medium text-text-primary hover:text-interactive"
                  >
                    {v.name}
                  </Link>
                  <MapPin className="h-4 w-4 text-text-tertiary shrink-0" />
                </div>
                <p className="mt-1 text-xs text-text-tertiary">
                  {[v.city, v.country].filter(Boolean).join(", ") || "—"}
                </p>
                <div className="mt-4 flex justify-between text-xs">
                  <span className="text-text-tertiary">Capacity</span>
                  <span className="text-text-primary font-medium">
                    {v.capacity.toLocaleString()}
                  </span>
                </div>
                <div className="mt-1 flex justify-between text-xs">
                  <span className="text-text-tertiary">Events using venue</span>
                  <span className="text-text-primary font-medium">
                    {eventCounts.get(v.id) ?? 0}
                  </span>
                </div>
                {canManage ? (
                  <div className="mt-4 pt-3 border-t border-border-subtle flex justify-end">
                    <DeleteVenueForm venueId={v.id} />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
