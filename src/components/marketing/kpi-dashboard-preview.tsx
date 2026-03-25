"use client";

import { TrendingUp, Users, DollarSign, Calendar, MapPin } from "lucide-react";

/** Illustrative UI only — values are placeholders, not live or third-party claims. */
const kpiCards = [
  {
    label: "Total Attendees",
    value: "—",
    change: "Your data",
    trend: "up" as const,
    icon: <Users className="h-4 w-4" />,
    sparkline: [40, 55, 45, 60, 50, 70, 65, 80, 75, 90, 85, 100],
  },
  {
    label: "Revenue",
    value: "—",
    change: "Your data",
    trend: "up" as const,
    icon: <DollarSign className="h-4 w-4" />,
    sparkline: [30, 35, 40, 38, 45, 50, 48, 55, 60, 58, 65, 72],
  },
  {
    label: "Active Events",
    value: "—",
    change: "Your data",
    trend: "up" as const,
    icon: <Calendar className="h-4 w-4" />,
    sparkline: [20, 25, 30, 35, 32, 40, 45, 50, 48, 55, 60, 68],
  },
  {
    label: "Venues",
    value: "—",
    change: "Your data",
    trend: "up" as const,
    icon: <MapPin className="h-4 w-4" />,
    sparkline: [50, 52, 55, 53, 58, 60, 62, 65, 63, 68, 70, 74],
  },
];

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const height = 32;
  const width = 80;
  const step = width / (data.length - 1);

  const points = data
    .map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
    >
      <polyline
        points={points}
        fill="none"
        stroke="#0F62FE"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const recentEvents = [
  {
    name: "Sample conference",
    location: "City",
    attendees: "—",
    status: "Draft",
  },
  {
    name: "Sample exhibition",
    location: "City",
    attendees: "—",
    status: "Planning",
  },
  {
    name: "Sample meeting",
    location: "City",
    attendees: "—",
    status: "Live",
  },
];

export function KPIDashboardPreview() {
  return (
    <div
      className="relative rounded-sm border border-border-subtle bg-layer-01 shadow-2xl overflow-hidden"
      aria-label="Illustrative dashboard preview (sample layout only)"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-layer-02">
        <span className="text-xs font-medium text-text-secondary">
          Overview (preview)
        </span>
        <span className="text-[10px] text-text-tertiary uppercase tracking-wider">
          Illustration
        </span>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {kpiCards.map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-sm border border-border-subtle bg-background p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="text-text-tertiary">{kpi.icon}</div>
                <Sparkline data={kpi.sparkline} />
              </div>
              <div className="mt-2 text-lg font-semibold text-text-primary tabular-nums">
                {kpi.value}
              </div>
              <div className="text-[11px] text-text-tertiary">{kpi.label}</div>
              <div className="mt-1 flex items-center gap-1 text-[11px] text-accent">
                <TrendingUp className="h-3 w-3" />
                {kpi.change}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-sm border border-border-subtle overflow-hidden">
          <div className="px-3 py-2 bg-layer-02 text-[11px] font-medium text-text-secondary uppercase tracking-wider">
            Recent events (sample)
          </div>
          {recentEvents.map((ev) => (
            <div
              key={ev.name}
              className="flex items-center justify-between px-3 py-2 border-t border-border-subtle text-xs"
            >
              <div>
                <div className="text-text-primary font-medium">{ev.name}</div>
                <div className="text-text-tertiary">{ev.location}</div>
              </div>
              <div className="text-right">
                <div className="text-text-primary">{ev.attendees}</div>
                <div className="text-[10px] text-text-tertiary">{ev.status}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
