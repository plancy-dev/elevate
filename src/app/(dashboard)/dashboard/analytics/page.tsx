import { TrendingUp } from "lucide-react";
import { ensureDefaultOrganization } from "@/actions/onboarding";
import { getMonthlyRollupsForOrg } from "@/lib/data/analytics";
import { formatCurrency } from "@/lib/utils";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const ensured = await ensureDefaultOrganization();
  if (!ensured.ok) {
    return (
      <div className="min-h-screen bg-background p-6">
        <p className="text-sm text-danger">{ensured.error}</p>
      </div>
    );
  }

  const series = await getMonthlyRollupsForOrg(ensured.organizationId);
  const maxA =
    series.length > 0 ? Math.max(...series.map((s) => s.attendees), 1) : 1;

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
              Registrations & revenue by month (event start date)
            </span>
          </div>
          {series.length === 0 ? (
            <p className="text-sm text-text-tertiary">
              No data yet. Create events and add attendees to see monthly
              registration counts and revenue.
            </p>
          ) : (
            <>
              <div className="flex items-end gap-3 h-40">
                {series.map((s) => (
                  <div
                    key={s.key}
                    className="flex-1 flex flex-col items-center gap-2"
                  >
                    <div
                      className="w-full bg-primary/80 min-h-[4px] transition-all rounded-t-sm"
                      style={{
                        height: `${Math.max(8, (s.attendees / maxA) * 100)}%`,
                      }}
                      title={`${s.attendees} registrations · ${formatCurrency(s.revenueCents)}`}
                    />
                    <span className="text-xs text-text-tertiary">{s.label}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-text-tertiary">
                Bar height follows registration count; tooltips include revenue
                summed from `events.revenue_cents` for events starting in that
                month.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
