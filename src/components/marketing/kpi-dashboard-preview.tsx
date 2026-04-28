"use client";

import { TrendingUp, Users, DollarSign, Calendar, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const height = 18;
  const width = 56;
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
      className="overflow-visible text-vermilion-600"
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
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
      className="relative overflow-hidden border border-ink-100 bg-paper-100"
      aria-label={t("previewTitle")}
    >
      <div className="border-b border-ink-100 bg-paper-50 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
            {t("productUiPreview")}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
            {t("illustration")}
          </span>
        </div>
        <p className="mt-1 text-sm font-medium text-ink-900">{t("previewTitle")}</p>
      </div>

      <div className="space-y-3 p-4">
        <div className="grid grid-cols-2 gap-px border border-ink-100 bg-ink-100">
          {kpiCards.map((kpi) => (
            <div
              key={kpi.label}
              className="bg-paper-50 p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
                  {kpi.label}
                </span>
                <span className="text-ink-300">{kpi.icon}</span>
              </div>
              <div className="mt-2 text-xl font-semibold tabular-nums text-ink-900">
                {kpi.value}
              </div>
              <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-ink-500">
                <TrendingUp className="h-3 w-3 shrink-0" strokeWidth={2} />
                <span>{kpi.change}</span>
                <Sparkline data={kpi.sparkline} />
              </div>
            </div>
          ))}
        </div>

        <div className="overflow-hidden border border-ink-100">
          <div className="bg-paper-50 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
            {t("recentSample")}
          </div>
          {recentEvents.map((ev) => (
            <div
              key={ev.name}
              className="grid grid-cols-[1fr_auto] items-center border-t border-ink-100 px-3 py-2 text-xs"
            >
              <div>
                <div className="font-medium text-ink-900">{ev.name}</div>
                <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
                  {ev.location}
                </div>
              </div>
              <div className="text-right">
                <div className="tabular-nums text-ink-900">{ev.attendees}</div>
                <div className="text-[10px] text-ink-500">{ev.status}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
