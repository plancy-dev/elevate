import { ensureDefaultOrganization } from "@/actions/onboarding";
import { TeamPageClient } from "@/components/dashboard/team-page-client";
import {
  listOrgMembers,
  listPendingInvitations,
} from "@/lib/data/team";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Team" };

export default async function TeamPage() {
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
  if (!user) return null;

  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = prof?.role ?? "viewer";
  const canInvite = role === "admin" || role === "organizer";
  const canManageRoles = role === "admin";

  const [members, invitations] = await Promise.all([
    listOrgMembers(ensured.organizationId),
    listPendingInvitations(ensured.organizationId),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-30 flex items-center border-b border-border-subtle bg-background px-6 h-12">
        <h1 className="text-sm font-medium text-text-primary">Team</h1>
      </div>
      <TeamPageClient
        members={members}
        invitations={invitations}
        canInvite={canInvite}
        canManageRoles={canManageRoles}
        currentUserId={user.id}
      />
    </div>
  );
}
