"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import {
  updateProfileAndNotifications,
  type SettingsActionState,
} from "@/actions/settings";
import { translateActionErrorMessage } from "@/lib/i18n/translate-action-error";
import { Button } from "@/components/ui/button";

export function SettingsProfileForm({
  defaultDisplayName,
  defaultEmailMilestoneDigest,
}: {
  defaultDisplayName: string;
  defaultEmailMilestoneDigest: boolean;
}) {
  const t = useTranslations("Dashboard.settingsProfile");
  const tAction = useTranslations("Dashboard.actionErrors");
  const initialState: SettingsActionState = undefined;
  const [state, formAction, pending] = useActionState(
    updateProfileAndNotifications,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <p className="rounded-sm border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
          {translateActionErrorMessage(state.error, tAction)}
        </p>
      )}
      <div>
        <label
          htmlFor="display_name"
          className="block text-xs text-text-secondary mb-1"
        >
          {t("displayNameLabel")}
        </label>
        <input
          id="display_name"
          name="display_name"
          defaultValue={defaultDisplayName}
          maxLength={200}
          className="h-10 w-full bg-field border border-border-subtle px-3 text-sm text-text-primary focus:outline-none focus:border-focus"
          placeholder={t("displayNamePlaceholder")}
        />
        <p className="mt-1 text-xs text-text-tertiary">
          {t("displayNameHint")}
        </p>
      </div>

      <div>
        <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
          {t("notificationsHeading")}
        </h3>
        <label className="mt-3 flex items-center gap-2 text-sm text-text-secondary">
          <input
            type="checkbox"
            name="email_milestone_digest"
            value="on"
            defaultChecked={defaultEmailMilestoneDigest}
            className="rounded border-border"
          />
          {t("digestLabel")}
        </label>
        <p className="mt-2 text-xs text-text-tertiary">{t("digestHint")}</p>
      </div>

      <Button variant="primary" size="md" type="submit" isLoading={pending}>
        {t("save")}
      </Button>
    </form>
  );
}
