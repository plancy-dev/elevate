import { ensureDefaultOrganization } from "@/actions/onboarding";
import { ConnectedIdentities } from "@/components/auth/connected-identities";
import { SettingsOrgForm } from "@/components/dashboard/settings-org-form";
import { SettingsProfileForm } from "@/components/dashboard/settings-profile-form";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types";

export const metadata = { title: "Settings" };

const ORG_MANAGERS: UserRole[] = ["admin", "organizer"];

export default async function SettingsPage() {
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
  if (!user) {
    return null;
  }

  const [{ data: org }, { data: profile }] = await Promise.all([
    supabase
      .from("organizations")
      .select("name")
      .eq("id", ensured.organizationId)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("display_name, role, email_milestone_digest")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  const role = (profile?.role ?? "viewer") as UserRole;
  const canManageOrg = ORG_MANAGERS.includes(role);
  const digest =
    (profile as { email_milestone_digest?: boolean } | null)
      ?.email_milestone_digest ?? true;

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-30 flex items-center border-b border-border-subtle bg-background px-6 h-12">
        <h1 className="text-sm font-medium text-text-primary">Settings</h1>
      </div>

      <div className="p-6 max-w-xl space-y-8">
        <section>
          <h2 className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
            Connected accounts
          </h2>
          <div className="mt-3">
            <ConnectedIdentities />
          </div>
        </section>

        <section>
          <h2 className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
            Organization
          </h2>
          <div className="mt-3">
            {canManageOrg ? (
              <SettingsOrgForm defaultName={org?.name ?? ""} />
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-text-secondary mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={org?.name ?? ""}
                    className="h-10 w-full bg-field border border-border-subtle px-3 text-sm text-text-tertiary focus:outline-none"
                  />
                  <p className="mt-1 text-xs text-text-tertiary">
                    Only organization admins and organizers can change the
                    organization name.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
            Your profile
          </h2>
          <div className="mt-3">
            <SettingsProfileForm
              defaultDisplayName={profile?.display_name ?? ""}
              defaultEmailMilestoneDigest={digest}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
