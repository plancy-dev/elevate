import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  Edit,
  MoreHorizontal,
  CheckCircle2,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ensureDefaultOrganization } from "@/actions/onboarding";
import { DeleteEventForm } from "@/components/dashboard/delete-event-form";
import { Button, ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  EVENT_STATUS_LABEL,
  eventTypeLabel,
  formatEventDateRange,
  getEventDetailPageData,
} from "@/lib/data/events";
import { formatCurrency } from "@/lib/utils";

export const metadata = { title: "Event Detail" };

const regTypeColors: Record<string, string> = {
  general: "bg-[#393939] text-text-secondary",
  vip: "bg-[#0043CE]/20 text-info",
  speaker: "bg-[#198038]/20 text-accent",
  sponsor: "bg-[#8A3FFC]/20 text-[#BE95FF]",
  media: "bg-[#6929C4]/20 text-[#D4BBFF]",
};

type PageProps = { params: Promise<{ id: string }> };

export default async function EventDetailPage({ params }: PageProps) {
  const ensured = await ensureDefaultOrganization();
  if (!ensured.ok) {
    return (
      <div className="min-h-screen bg-background p-6">
        <p className="text-sm text-danger">{ensured.error}</p>
      </div>
    );
  }

  const { id } = await params;
  const data = await getEventDetailPageData(id);
  if (!data) notFound();

  const { event, locationLabel, sessions, topAttendees, registeredCount, checkedInCount, npsAvg } =
    data;

  const checkInRate =
    registeredCount > 0
      ? Math.round((checkedInCount / registeredCount) * 100)
      : 0;
  const fillRate =
    event.expected_attendees > 0
      ? Math.round((registeredCount / event.expected_attendees) * 100)
      : 0;

  const dateRange = formatEventDateRange(event.start_date, event.end_date);
  const revenueStr = formatCurrency(event.revenue_cents, event.currency);
  const budgetStr = formatCurrency(event.budget_cents, event.currency);

  const statusVariant =
    event.status === "live"
      ? "green"
      : event.status === "registration_open"
        ? "blue"
        : "warm-gray";

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border-subtle bg-background px-6 h-12">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/dashboard"
            className="text-text-tertiary hover:text-text-primary transition-colors shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span className="text-xs text-text-tertiary">/</span>
          <Link
            href="/dashboard/events"
            className="text-xs text-text-tertiary hover:text-text-primary transition-colors"
          >
            Events
          </Link>
          <span className="text-xs text-text-tertiary">/</span>
          <span className="text-xs text-text-primary font-medium truncate">
            {event.title}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ButtonLink
            href={`/dashboard/events/${id}/edit`}
            variant="ghost"
            size="sm"
          >
            <Edit className="h-3.5 w-3.5" />
            Edit
          </ButtonLink>
          <DeleteEventForm eventId={id} />
          <Button variant="ghost" size="sm" type="button">
            <MoreHorizontal className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <Badge variant={statusVariant}>
                {EVENT_STATUS_LABEL[event.status]}
              </Badge>
              <Badge variant="default">{eventTypeLabel(event.event_type)}</Badge>
            </div>
            <h1 className="text-2xl font-semibold tracking-[-0.02em] text-text-primary">
              {event.title}
            </h1>
            <p className="mt-2 text-sm text-text-tertiary max-w-2xl leading-relaxed">
              {event.description || "No description yet."}
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-text-secondary">
              <span className="flex items-center gap-1.5 min-w-0">
                <MapPin className="h-4 w-4 text-text-tertiary shrink-0" />
                <span className="truncate">{locationLabel}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-text-tertiary shrink-0" />
                {dateRange}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-text-tertiary shrink-0" />
                {event.timezone}
              </span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="secondary" size="md" type="button">
              <UserPlus className="h-4 w-4" />
              Add Attendee
            </Button>
            <Button variant="primary" size="md" type="button">
              Live Dashboard
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-px bg-border-subtle border border-border-subtle">
          {[
            {
              label: "Registered",
              value: registeredCount.toLocaleString(),
              sub: `${fillRate}% of expected`,
            },
            {
              label: "Checked In",
              value: checkedInCount.toLocaleString(),
              sub: `${checkInRate}% check-in rate`,
            },
            { label: "Revenue", value: revenueStr, sub: "total collected" },
            { label: "Budget", value: budgetStr, sub: "allocated" },
            {
              label: "NPS Score",
              value: npsAvg != null ? String(npsAvg) : "—",
              sub: "attendee satisfaction",
            },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="bg-layer-01 p-4 hover:bg-layer-02 transition-colors"
            >
              <div className="text-xs text-text-tertiary">{kpi.label}</div>
              <div className="text-2xl font-semibold text-text-primary mt-1">
                {kpi.value}
              </div>
              <div className="text-xs text-text-tertiary mt-0.5">{kpi.sub}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 border border-border-subtle bg-layer-01">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border-subtle">
              <h2 className="text-sm font-medium text-text-primary">Sessions</h2>
              <span className="text-xs text-text-tertiary">
                {sessions.length} sessions
              </span>
            </div>
            {sessions.length === 0 ? (
              <div className="px-5 py-8 text-sm text-text-tertiary">
                No sessions yet. Add sessions from your Supabase admin or a future
                editor.
              </div>
            ) : (
              <div className="divide-y divide-border-subtle">
                {sessions.map((session) => {
                  const cap = session.capacity || 1;
                  const fillPct = Math.round(
                    (session.registered_count / cap) * 100,
                  );
                  return (
                    <div
                      key={session.id}
                      className="px-5 py-3.5 hover:bg-layer-02 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-text-tertiary font-mono whitespace-nowrap">
                              {session.timeLabel}
                            </span>
                            <span className="text-sm font-medium text-text-primary truncate">
                              {session.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-text-tertiary">
                            <span>{session.speaker_line}</span>
                            <span>·</span>
                            <span>{session.room}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-sm text-text-primary">
                            {session.registered_count}/{session.capacity}
                          </div>
                          <div className="w-20 h-1 bg-surface-03 mt-1.5 overflow-hidden">
                            <div
                              className={`h-full ${fillPct >= 100 ? "bg-danger" : fillPct >= 80 ? "bg-warning" : "bg-primary"}`}
                              style={{ width: `${Math.min(fillPct, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border border-border-subtle bg-layer-01">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border-subtle">
              <h2 className="text-sm font-medium text-text-primary">
                Recent Attendees
              </h2>
              <Link
                href="/dashboard/attendees"
                className="text-xs text-interactive hover:text-primary transition-colors"
              >
                View all
              </Link>
            </div>
            {topAttendees.length === 0 ? (
              <div className="px-5 py-8 text-sm text-text-tertiary">
                No attendees imported yet.
              </div>
            ) : (
              <div className="divide-y divide-border-subtle">
                {topAttendees.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between px-5 py-3 hover:bg-layer-02 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <div className="h-8 w-8 rounded-full bg-surface-03 flex items-center justify-center">
                          <span className="text-xs font-medium text-text-secondary">
                            {att.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </span>
                        </div>
                        {att.checked_in && (
                          <CheckCircle2 className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 text-accent bg-layer-01 rounded-full" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm text-text-primary truncate">
                          {att.name}
                        </div>
                        <div className="text-xs text-text-tertiary truncate">
                          {att.company}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 text-xs font-medium shrink-0 ${regTypeColors[att.typeKey] ?? regTypeColors.general}`}
                    >
                      {att.type}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {registeredCount > 0 && (
              <div className="px-5 py-4 border-t border-border-subtle">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-text-tertiary">
                    Check-in Progress
                  </span>
                  <span className="text-xs font-medium text-text-primary">
                    {checkInRate}%
                  </span>
                </div>
                <div className="w-full h-2 bg-surface-03 overflow-hidden">
                  <div
                    className="h-full bg-accent transition-all"
                    style={{ width: `${checkInRate}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-text-tertiary">
                  <span>{checkedInCount.toLocaleString()} checked in</span>
                  <span>
                    {Math.max(0, registeredCount - checkedInCount).toLocaleString()}{" "}
                    remaining
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
