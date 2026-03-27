import { CheckCircle2, Circle } from "lucide-react";
import { ensureDefaultOrganization } from "@/actions/onboarding";
import { Button } from "@/components/ui/button";
import { listOrgAttendeesForOrg } from "@/lib/data/attendees";

export const metadata = { title: "Attendees" };

const typeColors: Record<string, string> = {
  vip: "bg-[#0043CE]/20 text-info",
  speaker: "bg-[#198038]/20 text-accent",
  sponsor: "bg-[#8A3FFC]/20 text-[#BE95FF]",
  media: "bg-[#FA4D56]/20 text-warning",
  general: "bg-[#393939] text-text-secondary",
};

export default async function AttendeesPage() {
  const ensured = await ensureDefaultOrganization();
  if (!ensured.ok) {
    return (
      <div className="min-h-screen bg-background p-6">
        <p className="text-sm text-danger">{ensured.error}</p>
      </div>
    );
  }

  const rows = await listOrgAttendeesForOrg(ensured.organizationId);

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border-subtle bg-background px-6 h-12">
        <h1 className="text-sm font-medium text-text-primary">Attendees</h1>
        <Button variant="secondary" size="sm" type="button" disabled>
          Import CSV
        </Button>
      </div>

      <div className="p-6">
        <div className="border border-border-subtle bg-layer-01 overflow-x-auto">
          <div className="grid grid-cols-[minmax(180px,1fr)_minmax(200px,1.2fr)_minmax(140px,1fr)_minmax(160px,1.2fr)_100px_100px] gap-4 px-5 py-2 border-b border-border-subtle text-xs font-medium text-text-tertiary uppercase tracking-wider min-w-[900px]">
            <span>Name</span>
            <span>Email</span>
            <span>Company</span>
            <span>Event</span>
            <span>Type</span>
            <span>Check-in</span>
          </div>
          {rows.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-text-tertiary">
              No attendees yet. Add attendees from an event detail page when
              registration data is connected.
            </div>
          ) : (
            rows.map((a) => (
              <div
                key={a.id}
                className="grid grid-cols-[minmax(180px,1fr)_minmax(200px,1.2fr)_minmax(140px,1fr)_minmax(160px,1.2fr)_100px_100px] gap-4 px-5 py-3 border-b border-border-subtle last:border-b-0 hover:bg-layer-02 transition-colors items-center min-w-[900px]"
              >
                <span className="text-sm text-text-primary">{a.name}</span>
                <span className="text-xs text-text-tertiary truncate">
                  {a.email}
                </span>
                <span className="text-sm text-text-secondary truncate">
                  {a.company}
                </span>
                <span className="text-xs text-text-tertiary truncate">
                  {a.eventTitle}
                </span>
                <span>
                  <span
                    className={`inline-flex px-2 py-0.5 text-xs font-medium ${typeColors[a.registrationKey] ?? typeColors.general}`}
                  >
                    {a.registrationLabel}
                  </span>
                </span>
                <span className="flex justify-center">
                  {a.checkedIn ? (
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                  ) : (
                    <Circle className="h-4 w-4 text-text-tertiary" />
                  )}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
