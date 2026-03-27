import { ensureDefaultOrganization } from "@/actions/onboarding";
import { ConnectedIdentities } from "@/components/auth/connected-identities";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Settings" };

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
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

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
          <div className="mt-3 space-y-3">
            <div>
              <label className="block text-xs text-text-secondary mb-1">
                Name
              </label>
              <input
                type="text"
                readOnly
                defaultValue={org?.name ?? ""}
                className="h-10 w-full bg-field border border-border-subtle px-3 text-sm text-text-primary focus:outline-none focus:border-focus"
              />
              <p className="mt-1 text-xs text-text-tertiary">
                Organization name is managed in the database; editing UI coming
                soon.
              </p>
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">
                Profile display name
              </label>
              <input
                type="text"
                readOnly
                defaultValue={profile?.display_name ?? ""}
                className="h-10 w-full bg-field border border-border-subtle px-3 text-sm text-text-primary focus:outline-none focus:border-focus"
              />
              <p className="mt-1 text-xs text-text-tertiary">
                From your account profile (`profiles.display_name`).
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
            Notifications
          </h2>
          <label className="mt-3 flex items-center gap-2 text-sm text-text-secondary">
            <input type="checkbox" defaultChecked className="rounded border-border" />
            Email digest for event milestones
          </label>
          <p className="mt-2 text-xs text-text-tertiary">
            Notification delivery preferences will connect to your org settings
            in a later release.
          </p>
        </section>

        <Button variant="primary" size="md" type="button" disabled>
          Save changes
        </Button>
      </div>
    </div>
  );
}
