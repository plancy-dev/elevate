"use client";

import { useActionState } from "react";
import {
  updateOrganizationName,
  type SettingsActionState,
} from "@/actions/settings";
import { Button } from "@/components/ui/button";

export function SettingsOrgForm({ defaultName }: { defaultName: string }) {
  const initialState: SettingsActionState = undefined;
  const [state, formAction, pending] = useActionState(
    updateOrganizationName,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-3">
      {state?.error && (
        <p className="rounded-sm border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
          {state.error}
        </p>
      )}
      <div>
        <label
          htmlFor="organization_name"
          className="block text-xs text-text-secondary mb-1"
        >
          Name
        </label>
        <input
          id="organization_name"
          name="organization_name"
          required
          defaultValue={defaultName}
          maxLength={200}
          className="h-10 w-full bg-field border border-border-subtle px-3 text-sm text-text-primary focus:outline-none focus:border-focus"
        />
        <p className="mt-1 text-xs text-text-tertiary">
          Shown in the dashboard sidebar. URL slug is not changed when you rename.
        </p>
      </div>
      <Button variant="primary" size="md" type="submit" isLoading={pending}>
        Save organization
      </Button>
    </form>
  );
}
