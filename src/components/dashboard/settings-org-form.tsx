"use client";

import { useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import {
  updateOrganizationName,
  type SettingsActionState,
} from "@/actions/settings";
import { translateActionErrorMessage } from "@/lib/i18n/translate-action-error";
import { toast } from "@/lib/ui/app-toast";
import { Button } from "@/components/ui/button";

export function SettingsOrgForm({ defaultName }: { defaultName: string }) {
  const t = useTranslations("Dashboard.settingsOrg");
  const tAction = useTranslations("Dashboard.actionErrors");
  const initialState: SettingsActionState = undefined;
  const [state, formAction, pending] = useActionState(
    updateOrganizationName,
    initialState,
  );
  const prevPending = useRef(false);

  useEffect(() => {
    const done = prevPending.current && !pending && state?.success === true;
    prevPending.current = pending;
    if (done) toast.success(t("savedToast"));
  }, [pending, state?.success, t]);

  return (
    <form action={formAction} className="space-y-3">
      {state?.error && (
        <p className="rounded-[var(--radius-1)] border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
          {translateActionErrorMessage(state.error, tAction)}
        </p>
      )}
      <div>
        <label
          htmlFor="organization_name"
          className="block text-xs text-ink-700 mb-1"
        >
          {t("nameLabel")}
        </label>
        <input
          id="organization_name"
          name="organization_name"
          required
          defaultValue={defaultName}
          maxLength={200}
          className="h-10 w-full bg-paper-0 border border-ink-100 px-3 text-sm text-ink-900 focus:outline-none focus:border-focus"
        />
        <p className="mt-1 text-xs text-ink-500">{t("nameHint")}</p>
      </div>
      <Button variant="primary" size="md" type="submit" isLoading={pending}>
        {t("save")}
      </Button>
    </form>
  );
}
