"use client";

import { useActionState } from "react";
import {
  updateProfileAndNotifications,
  type SettingsActionState,
} from "@/actions/settings";
import { Button } from "@/components/ui/button";

export function SettingsProfileForm({
  defaultDisplayName,
  defaultEmailMilestoneDigest,
}: {
  defaultDisplayName: string;
  defaultEmailMilestoneDigest: boolean;
}) {
  const initialState: SettingsActionState = undefined;
  const [state, formAction, pending] = useActionState(
    updateProfileAndNotifications,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <p className="rounded-sm border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
          {state.error}
        </p>
      )}
      <div>
        <label
          htmlFor="display_name"
          className="block text-xs text-text-secondary mb-1"
        >
          Profile display name
        </label>
        <input
          id="display_name"
          name="display_name"
          defaultValue={defaultDisplayName}
          maxLength={200}
          className="h-10 w-full bg-field border border-border-subtle px-3 text-sm text-text-primary focus:outline-none focus:border-focus"
          placeholder="Your name"
        />
        <p className="mt-1 text-xs text-text-tertiary">
          Shown in the sidebar and across the app.
        </p>
      </div>

      <div>
        <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
          Notifications
        </h3>
        <label className="mt-3 flex items-center gap-2 text-sm text-text-secondary">
          <input
            type="checkbox"
            name="email_milestone_digest"
            value="on"
            defaultChecked={defaultEmailMilestoneDigest}
            className="rounded border-border"
          />
          Email digest for event milestones
        </label>
        <p className="mt-2 text-xs text-text-tertiary">
          When enabled, we can include you in milestone summaries (delivery is
          configured per deployment).
        </p>
      </div>

      <Button variant="primary" size="md" type="submit" isLoading={pending}>
        Save profile &amp; notifications
      </Button>
    </form>
  );
}
