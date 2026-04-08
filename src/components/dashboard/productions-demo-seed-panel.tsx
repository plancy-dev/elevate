"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { seedDemoStudioProductions } from "@/actions/studio-productions-demo-seed";
import { isActionErrorCode } from "@/lib/i18n/action-error-codes";
import { Button } from "@/components/ui/button";

export function ProductionsDemoSeedPanel() {
  const t = useTranslations("Dashboard");
  const tProd = useTranslations("Dashboard.productions");
  const [state, action, pending] = useActionState(seedDemoStudioProductions, undefined);

  const errKey = state?.error;
  const errMsg =
    errKey && isActionErrorCode(errKey)
      ? t(`actionErrors.${errKey}` as never)
      : errKey
        ? t("actionErrors.unexpected")
        : null;

  return (
    <div className="rounded-xl border border-dashed border-border-subtle bg-layer-02/40 p-4 space-y-3">
      <div>
        <p className="text-sm font-medium text-text-primary">{tProd("demoSeedTitle")}</p>
        <p className="mt-1 text-xs text-text-tertiary leading-relaxed">{tProd("demoSeedBody")}</p>
      </div>
      <form action={action} className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button type="submit" variant="secondary" size="sm" disabled={pending}>
          {pending ? tProd("demoSeedPending") : tProd("demoSeedButton")}
        </Button>
        {errMsg ? (
          <span className="text-xs text-red-600 dark:text-red-400" role="alert">
            {errMsg}
          </span>
        ) : null}
      </form>
    </div>
  );
}
