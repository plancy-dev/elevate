import { Button } from "@/components/ui/button";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-30 flex items-center border-b border-border-subtle bg-background px-6 h-12">
        <h1 className="text-sm font-medium text-text-primary">Settings</h1>
      </div>

      <div className="p-6 max-w-xl space-y-8">
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
                defaultValue="Elevate Corp"
                className="h-10 w-full bg-field border border-border-subtle px-3 text-sm text-text-primary focus:outline-none focus:border-focus"
              />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">
                Default timezone
              </label>
              <select className="h-10 w-full bg-field border border-border-subtle px-3 text-sm text-text-primary focus:outline-none focus:border-focus">
                <option>Asia/Singapore</option>
                <option>Asia/Seoul</option>
                <option>UTC</option>
              </select>
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
        </section>

        <Button variant="primary" size="md">
          Save changes
        </Button>
      </div>
    </div>
  );
}
