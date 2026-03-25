import { TrendingUp } from "lucide-react";

export const metadata = { title: "Analytics" };

const series = [
  { month: "Jan", attendees: 4200, revenue: 42 },
  { month: "Feb", attendees: 5100, revenue: 48 },
  { month: "Mar", attendees: 6200, revenue: 55 },
  { month: "Apr", attendees: 5800, revenue: 52 },
];

export default function AnalyticsPage() {
  const maxA = Math.max(...series.map((s) => s.attendees));
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-30 flex items-center border-b border-border-subtle bg-background px-6 h-12">
        <h1 className="text-sm font-medium text-text-primary">Analytics</h1>
      </div>

      <div className="p-6 space-y-6">
        <div className="border border-border-subtle bg-layer-01 p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium text-text-primary">
              Attendance trend (demo)
            </span>
          </div>
          <div className="flex items-end gap-3 h-40">
            {series.map((s) => (
              <div
                key={s.month}
                className="flex-1 flex flex-col items-center gap-2"
              >
                <div
                  className="w-full bg-primary/80 min-h-[4px] transition-all"
                  style={{
                    height: `${Math.max(8, (s.attendees / maxA) * 100)}%`,
                  }}
                />
                <span className="text-xs text-text-tertiary">{s.month}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-text-tertiary">
            Connect Supabase and charting library (e.g. Recharts) for production
            analytics.
          </p>
        </div>
      </div>
    </div>
  );
}
