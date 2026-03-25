import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Calendar,
  MapPin,
  ArrowRight,
  Plus,
  MoreHorizontal,
} from "lucide-react";
import Link from "next/link";
import { ensureDefaultOrganization } from "@/actions/onboarding";
import { ButtonLink } from "@/components/ui/button";
import {
  EVENT_STATUS_BADGE_CLASS,
  EVENT_STATUS_LABEL,
  formatEventDateRange,
  formatEventRevenue,
  getDashboardStats,
  listOrgEvents,
} from "@/lib/data/events";
import { formatCompactNumber, formatCurrency } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

const recentActivity: { text: string; time: string }[] = [];

export default async function DashboardPage() {
  const ensured = await ensureDefaultOrganization();
  if (!ensured.ok) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-lg rounded-sm border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {ensured.error}
        </div>
      </div>
    );
  }

  const orgId = ensured.organizationId;
  const [stats, events] = await Promise.all([
    getDashboardStats(orgId),
    listOrgEvents(orgId),
  ]);

  const previewEvents = events.slice(0, 5);

  const kpis = [
    {
      label: "Total Attendees",
      value: formatCompactNumber(stats.totalAttendees),
      change: "—",
      trend: "up" as const,
      icon: Users,
      period: "all events",
    },
    {
      label: "Revenue",
      value: formatCurrency(stats.revenueCents),
      change: "—",
      trend: "up" as const,
      icon: DollarSign,
      period: "all events",
    },
    {
      label: "Active Events",
      value: String(stats.activeEvents),
      change: "—",
      trend: "up" as const,
      icon: Calendar,
      period: "live & registration",
    },
    {
      label: "Avg. NPS Score",
      value: "—",
      change: "—",
      trend: "down" as const,
      icon: TrendingUp,
      period: "when collected",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border-subtle bg-background px-6 h-12">
        <div>
          <h1 className="text-sm font-medium text-text-primary">Overview</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-text-tertiary">Live data</span>
          <ButtonLink href="/dashboard/events/new" variant="primary" size="sm">
            <Plus className="h-3.5 w-3.5" />
            New Event
          </ButtonLink>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-px bg-border-subtle border border-border-subtle">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="bg-layer-01 p-5 hover:bg-layer-02 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <kpi.icon className="h-4 w-4 text-text-tertiary" />
                  <span className="text-xs text-text-tertiary">{kpi.label}</span>
                </div>
                <button
                  type="button"
                  className="text-text-tertiary hover:text-text-secondary"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
              <div className="text-3xl font-semibold tracking-tight text-text-primary">
                {kpi.value}
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                {kpi.change === "—" ? (
                  <span className="text-xs text-text-tertiary">{kpi.period}</span>
                ) : (
                  <>
                    {kpi.trend === "up" ? (
                      <TrendingUp className="h-3.5 w-3.5 text-accent" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5 text-danger" />
                    )}
                    <span
                      className={`text-xs font-medium ${kpi.trend === "up" ? "text-accent" : "text-danger"}`}
                    >
                      {kpi.change}
                    </span>
                    <span className="text-xs text-text-tertiary">
                      {kpi.period}
                    </span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="grid xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 border border-border-subtle bg-layer-01">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border-subtle">
              <h2 className="text-sm font-medium text-text-primary">Events</h2>
              <Link
                href="/dashboard/events"
                className="text-xs text-interactive hover:text-primary flex items-center gap-1 transition-colors"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="grid grid-cols-[1fr_100px_100px_100px_120px] gap-4 px-5 py-2 border-b border-border-subtle text-xs font-medium text-text-tertiary uppercase tracking-wider">
              <span>Event</span>
              <span>Attendees</span>
              <span>Revenue</span>
              <span>Status</span>
              <span>Date</span>
            </div>

            {previewEvents.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-text-tertiary">
                No events yet.{" "}
                <Link
                  href="/dashboard/events/new"
                  className="text-interactive hover:text-primary"
                >
                  Create your first event
                </Link>
                .
              </div>
            ) : (
              previewEvents.map((event) => {
                const location = event.venue
                  ? [event.venue.name, event.venue.city]
                      .filter(Boolean)
                      .join(", ")
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

          <div className="border border-border-subtle bg-layer-01">
            <div className="px-5 py-3 border-b border-border-subtle">
              <h2 className="text-sm font-medium text-text-primary">
                Recent Activity
              </h2>
            </div>
            {recentActivity.length === 0 ? (
              <div className="px-5 py-8 text-sm text-text-tertiary">
                Activity will appear here as your team uses Elevate.
              </div>
            ) : (
              <div className="divide-y divide-border-subtle">
                {recentActivity.map((activity, i) => (
                  <div key={i} className="px-5 py-3">
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {activity.text}
                    </p>
                    <p className="text-xs text-text-tertiary mt-1">
                      {activity.time}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border-subtle border border-border-subtle">
          {[
            {
              label: "Total events",
              value: String(stats.totalEvents),
              sub: "in your organization",
            },
            {
              label: "Reporting period",
              value: "All time",
              sub: "live metrics",
            },
            {
              label: "Leads",
              value: "—",
              sub: "connect CRM to track",
            },
            {
              label: "Returning attendees",
              value: "—",
              sub: "when historical data exists",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-layer-01 p-5 hover:bg-layer-02 transition-colors"
            >
              <div className="text-xs text-text-tertiary">{stat.label}</div>
              <div className="text-2xl font-semibold text-text-primary mt-1">
                {stat.value}
              </div>
              <div className="text-xs text-text-tertiary mt-1">{stat.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
