import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ensureDefaultOrganization } from "@/actions/onboarding";
import { ActionErrorMessage } from "@/components/i18n/action-error-message";
import { TeamPageClient } from "@/components/dashboard/team-page-client";
import {
  listOrgMembers,
  listPendingInvitations,
} from "@/lib/data/team";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Dashboard.pages");
  return { title: t("team.title") };
}

export default async function TeamPage() {
  const ensured = await ensureDefaultOrganization();
  if (!ensured.ok) {
    return (
      <div className="min-h-screen bg-paper-50 p-6">
        <ActionErrorMessage code={ensured.error} />
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

  const t = await getTranslations("Dashboard.pages");

  return (
    <div className="min-h-screen bg-paper-50">
      <div className="sticky top-0 z-30 flex items-center border-b border-ink-100 bg-paper-50 px-6 h-12">
        <h1 className="text-sm font-medium text-ink-900">{t("team.title")}</h1>
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
