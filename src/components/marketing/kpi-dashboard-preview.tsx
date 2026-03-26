"use client";

import { TrendingUp, Users, DollarSign, Calendar, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";

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
      className="overflow-visible text-primary"
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Illustrative UI only — values are placeholders, not live or third-party claims. */
export function KPIDashboardPreview() {
  const t = useTranslations("KpiPreview");

  const kpiCards = [
    {
      label: t("kpiAttendees"),
      value: "—",
      change: t("kpiChange"),
      icon: <Users className="h-4 w-4" />,
      sparkline: [40, 55, 45, 60, 50, 70, 65, 80, 75, 90, 85, 100],
    },
    {
      label: t("kpiRevenue"),
      value: "—",
      change: t("kpiChange"),
      icon: <DollarSign className="h-4 w-4" />,
      sparkline: [30, 35, 40, 38, 45, 50, 48, 55, 60, 58, 65, 72],
    },
    {
      label: t("kpiEvents"),
      value: "—",
      change: t("kpiChange"),
      icon: <Calendar className="h-4 w-4" />,
      sparkline: [20, 25, 30, 35, 32, 40, 45, 50, 48, 55, 60, 68],
    },
    {
      label: t("kpiVenues"),
      value: "—",
      change: t("kpiChange"),
      icon: <MapPin className="h-4 w-4" />,
      sparkline: [50, 52, 55, 53, 58, 60, 62, 65, 63, 68, 70, 74],
    },
  ];

  const recentEvents = [
    {
      name: t("event1Name"),
      location: t("event1Location"),
      attendees: "—",
      status: t("statusDraft"),
    },
    {
      name: t("event2Name"),
      location: t("event2Location"),
      attendees: "—",
      status: t("statusPlanning"),
    },
    {
      name: t("event3Name"),
      location: t("event3Location"),
      attendees: "—",
      status: t("statusLive"),
    },
  ];

  return (
    <div
      className="relative rounded-sm border border-border-subtle bg-layer-01 shadow-2xl overflow-hidden"
      aria-label={t("previewTitle")}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-layer-02">
        <span className="text-xs font-medium text-text-secondary">
          {t("previewTitle")}
        </span>
        <span className="text-[10px] text-text-tertiary uppercase tracking-wider">
          {t("illustration")}
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
            {t("recentSample")}
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
