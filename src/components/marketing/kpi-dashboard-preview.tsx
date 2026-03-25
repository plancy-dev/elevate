"use client";

import { TrendingUp, Users, DollarSign, Calendar, MapPin } from "lucide-react";

const kpiCards = [
  {
    label: "Total Attendees",
    value: "15,495",
    change: "+12.3%",
    trend: "up" as const,
    icon: <Users className="h-4 w-4" />,
    sparkline: [40, 55, 45, 60, 50, 70, 65, 80, 75, 90, 85, 100],
  },
  {
    label: "Revenue",
    value: "$300M",
    change: "+8.7%",
    trend: "up" as const,
    icon: <DollarSign className="h-4 w-4" />,
    sparkline: [30, 35, 40, 38, 45, 50, 48, 55, 60, 58, 65, 72],
  },
  {
    label: "Active Events",
    value: "284",
    change: "+23.1%",
    trend: "up" as const,
    icon: <Calendar className="h-4 w-4" />,
    sparkline: [20, 25, 30, 35, 32, 40, 45, 50, 48, 55, 60, 68],
  },
  {
    label: "Venues Managed",
    value: "1,247",
    change: "+5.4%",
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
    name: "Global Tech Summit 2026",
    location: "Singapore",
    attendees: "4,200",
    status: "Live",
  },
  {
    name: "MICE Asia Conference",
    location: "Seoul",
    attendees: "2,800",
    status: "Live",
  },
  {
    name: "MedTech Expo Berlin",
    location: "Berlin",
    attendees: "3,150",
    status: "Upcoming",
  },
  {
    name: "Corporate Leadership Forum",
    location: "New York",
    attendees: "1,600",
    status: "Completed",
  },
];

const statusColor: Record<string, string> = {
  Live: "bg-accent/20 text-accent",
  Upcoming: "bg-info/20 text-info",
  Completed: "bg-surface-03 text-text-tertiary",
};

export function KPIDashboardPreview() {
  return (
    <div className="relative rounded-sm border border-border-subtle bg-layer-01 overflow-hidden shadow-2xl shadow-black/40">
      {/* Dashboard top bar */}
      <div className="flex items-center justify-between border-b border-border-subtle px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-6 w-6 bg-primary">
            <span
              className="text-xs font-serif italic font-bold text-white leading-none"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              e
            </span>
          </div>
          <span className="text-xs font-medium text-text-secondary">
            Dashboard
          </span>
          <span className="text-xs text-text-tertiary">/</span>
          <span className="text-xs text-text-tertiary">Overview</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-text-tertiary">Q1 2026</span>
          <div className="h-6 w-6 rounded-full bg-surface-03 flex items-center justify-center">
            <span className="text-[10px] font-medium text-text-secondary">
              JK
            </span>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi, i) => (
          <div
            key={kpi.label}
            className={`px-5 py-4 ${i < 3 ? "border-r border-border-subtle" : ""} ${i < 2 ? "border-b border-border-subtle lg:border-b-0" : i < 4 ? "border-b border-border-subtle lg:border-b-0" : ""}`}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-text-tertiary">{kpi.icon}</span>
              <span className="text-xs text-text-tertiary">{kpi.label}</span>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-2xl font-semibold tracking-tight text-text-primary">
                  {kpi.value}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-accent" />
                  <span className="text-xs font-medium text-accent">
                    {kpi.change}
                  </span>
                </div>
              </div>
              <Sparkline data={kpi.sparkline} />
            </div>
          </div>
        ))}
      </div>

      {/* Event List */}
      <div className="border-t border-border-subtle">
        <div className="px-5 py-3 border-b border-border-subtle">
          <span className="text-xs font-medium text-text-secondary">
            Recent Events
          </span>
        </div>
        <div>
          {recentEvents.map((event, i) => (
            <div
              key={event.name}
              className={`flex items-center justify-between px-5 py-2.5 ${i < recentEvents.length - 1 ? "border-b border-border-subtle" : ""} hover:bg-layer-02 transition-colors`}
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm text-text-primary truncate">
                  {event.name}
                </div>
                <div className="text-xs text-text-tertiary">
                  {event.location}
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0 ml-4">
                <div className="text-right">
                  <div className="text-sm font-medium text-text-primary">
                    {event.attendees}
                  </div>
                  <div className="text-xs text-text-tertiary">attendees</div>
                </div>
                <span
                  className={`px-2 py-0.5 text-xs font-medium ${statusColor[event.status]}`}
                >
                  {event.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
