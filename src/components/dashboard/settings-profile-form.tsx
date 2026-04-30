"use client";

import { useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import {
  updateProfileAndNotifications,
  type SettingsActionState,
} from "@/actions/settings";
import type {
  SidebarIconTonePreference,
  SpinnerTempoPreference,
} from "@/lib/settings-validation";
import { translateActionErrorMessage } from "@/lib/i18n/translate-action-error";
import { toast } from "@/lib/ui/app-toast";
import { Button } from "@/components/ui/button";

export function SettingsProfileForm({
  defaultDisplayName,
  defaultEmailMilestoneDigest,
  defaultLoadingSpinnerTempo,
  defaultSidebarIconTone,
}: {
  defaultDisplayName: string;
  defaultEmailMilestoneDigest: boolean;
  defaultLoadingSpinnerTempo: SpinnerTempoPreference;
  defaultSidebarIconTone: SidebarIconTonePreference;
}) {
  const t = useTranslations("Dashboard.settingsProfile");
  const tAction = useTranslations("Dashboard.actionErrors");
  const initialState: SettingsActionState = undefined;
  const [state, formAction, pending] = useActionState(
    updateProfileAndNotifications,
    initialState,
  );
  const prevPending = useRef(false);

  useEffect(() => {
    const done = prevPending.current && !pending && state?.success === true;
    prevPending.current = pending;
    if (done) toast.success(t("savedToast"));
  }, [pending, state?.success, t]);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <p className="rounded-[var(--radius-1)] border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
          {translateActionErrorMessage(state.error, tAction)}
        </p>
      )}
      <div>
        <label
          htmlFor="display_name"
          className="block text-xs text-ink-700 mb-1"
        >
          {t("displayNameLabel")}
        </label>
        <input
          id="display_name"
          name="display_name"
          defaultValue={defaultDisplayName}
          maxLength={200}
          className="h-10 w-full bg-paper-0 border border-ink-100 px-3 text-sm text-ink-900 focus:outline-none focus:border-focus"
          placeholder={t("displayNamePlaceholder")}
        />
        <p className="mt-1 text-xs text-ink-500">
          {t("displayNameHint")}
        </p>
      </div>

      <div>
        <h3 className="text-xs font-medium text-ink-500 uppercase tracking-wider">
          {t("notificationsHeading")}
        </h3>
        <label className="mt-3 flex items-center gap-2 text-sm text-ink-700">
          <input
            type="checkbox"
            name="email_milestone_digest"
            value="on"
            defaultChecked={defaultEmailMilestoneDigest}
            className="rounded border-border"
          />
          {t("digestLabel")}
        </label>
        <p className="mt-2 text-xs text-ink-500">{t("digestHint")}</p>
      </div>

      <div>
        <h3 className="text-xs font-medium text-ink-500 uppercase tracking-wider">
          {t("loadingTempoHeading")}
        </h3>
        <label htmlFor="loading_spinner_tempo" className="mt-3 block text-sm text-ink-700">
          {t("loadingTempoLabel")}
        </label>
        <select
          id="loading_spinner_tempo"
          name="loading_spinner_tempo"
          defaultValue={defaultLoadingSpinnerTempo}
          className="mt-1 h-10 w-full border border-ink-100 bg-paper-0 px-3 text-sm text-ink-900 focus:border-focus focus:outline-none"
        >
          <option value="calm">{t("loadingTempoCalm")}</option>
          <option value="lively">{t("loadingTempoLively")}</option>
        </select>
        <p className="mt-2 text-xs text-ink-500">{t("loadingTempoHint")}</p>
      </div>

      <div>
        <h3 className="text-xs font-medium text-ink-500 uppercase tracking-wider">
          {t("sidebarToneHeading")}
        </h3>
        <label htmlFor="sidebar_icon_tone" className="mt-3 block text-sm text-ink-700">
          {t("sidebarToneLabel")}
        </label>
        <select
          id="sidebar_icon_tone"
          name="sidebar_icon_tone"
          defaultValue={defaultSidebarIconTone}
          className="mt-1 h-10 w-full border border-ink-100 bg-paper-0 px-3 text-sm text-ink-900 focus:border-focus focus:outline-none"
        >
          <option value="calm">{t("sidebarToneCalm")}</option>
          <option value="focus">{t("sidebarToneFocus")}</option>
        </select>
        <p className="mt-2 text-xs text-ink-500">{t("sidebarToneHint")}</p>
      </div>

      <Button variant="primary" size="md" type="submit" isLoading={pending}>
        {t("save")}
      </Button>
    </form>
  );
}
