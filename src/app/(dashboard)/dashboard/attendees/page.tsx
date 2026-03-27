import { ensureDefaultOrganization } from "@/actions/onboarding";
import { AttendeesPageClient } from "@/components/dashboard/attendees-page-client";
import { listOrgAttendeesForOrg } from "@/lib/data/attendees";
import { listOrgEvents } from "@/lib/data/events";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Attendees" };

export default async function AttendeesPage() {
  const ensured = await ensureDefaultOrganization();
  if (!ensured.ok) {
    return (
      <div className="min-h-screen bg-background p-6">
        <p className="text-sm text-danger">{ensured.error}</p>
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let canEdit = false;
  if (user) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    const r = prof?.role ?? "";
    canEdit = ["admin", "organizer", "coordinator"].includes(r);
  }

  const [rows, events] = await Promise.all([
    listOrgAttendeesForOrg(ensured.organizationId),
    listOrgEvents(ensured.organizationId),
  ]);

  const eventOptions = events.map((e) => ({ id: e.id, title: e.title }));

  return (
    <div className="min-h-screen bg-background">
      <AttendeesPageClient
        rows={rows}
        events={eventOptions}
        canEdit={canEdit}
      />
    </div>
  );
}
