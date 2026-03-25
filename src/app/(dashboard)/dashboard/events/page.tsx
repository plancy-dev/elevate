import Link from "next/link";
import { MapPin, Plus } from "lucide-react";
import { ensureDefaultOrganization } from "@/actions/onboarding";
import { ButtonLink } from "@/components/ui/button";
import {
  EVENT_STATUS_BADGE_CLASS,
  EVENT_STATUS_LABEL,
  formatEventDateRange,
  formatEventRevenue,
  listOrgEvents,
} from "@/lib/data/events";

export const metadata = { title: "Events" };

export default async function EventsListPage() {
  const ensured = await ensureDefaultOrganization();
  if (!ensured.ok) {
    return (
      <div className="min-h-screen bg-background p-6">
        <p className="text-sm text-danger">{ensured.error}</p>
      </div>
    );
  }

  const events = await listOrgEvents(ensured.organizationId);

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border-subtle bg-background px-6 h-12">
        <h1 className="text-sm font-medium text-text-primary">Events</h1>
        <ButtonLink href="/dashboard/events/new" variant="primary" size="sm">
          <Plus className="h-3.5 w-3.5" />
          New Event
        </ButtonLink>
      </div>

      <div className="p-6">
        <div className="border border-border-subtle bg-layer-01">
          <div className="grid grid-cols-[1fr_100px_100px_100px_120px] gap-4 px-5 py-2 border-b border-border-subtle text-xs font-medium text-text-tertiary uppercase tracking-wider">
            <span>Event</span>
            <span>Attendees</span>
            <span>Revenue</span>
            <span>Status</span>
            <span>Date</span>
          </div>
          {events.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-text-tertiary">
              No events yet.{" "}
              <Link
                href="/dashboard/events/new"
                className="text-interactive hover:text-primary"
              >
                Create one
              </Link>
            </div>
          ) : (
            events.map((event) => {
              const location = event.venue
                ? [event.venue.name, event.venue.city].filter(Boolean).join(", ")
                : "—";
              return (
                <Link
                  key={event.id}
                  href={`/dashboard/events/${event.id}`}
                  className="grid grid-cols-[1fr_100px_100px_100px_120px] gap-4 px-5 py-3 border-b border-border-subtle last:border-b-0 hover:bg-layer-02 transition-colors items-center"
                >
                  <div>
                    <div className="text-sm text-text-primary font-medium truncate">
                      {event.title}
                    </div>
                    <div className="text-xs text-text-tertiary flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{location}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-text-primary">
                      {event.actual_attendees.toLocaleString()}
                    </div>
                    <div className="text-xs text-text-tertiary">
                      / {event.expected_attendees.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-sm text-text-primary">
                    {formatEventRevenue(event)}
                  </div>
                  <div>
                    <span
                      className={`inline-flex px-2 py-0.5 text-xs font-medium ${EVENT_STATUS_BADGE_CLASS[event.status] ?? ""}`}
                    >
                      {EVENT_STATUS_LABEL[event.status]}
                    </span>
                  </div>
                  <div className="text-xs text-text-tertiary">
                    {formatEventDateRange(event.start_date, event.end_date)}
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
