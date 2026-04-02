"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setAppLocale } from "@/actions/locale";
import { routing } from "@/i18n/routing";

export function SettingsLocaleForm({
  defaultLocale,
}: {
  defaultLocale: string;
}) {
  const t = useTranslations("Dashboard.settings.language");
  const tLang = useTranslations("LanguageSwitcher");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function messageForLocaleError(code: string | undefined): string {
    if (code === "invalid_locale") return t("errors.invalidLocale");
    if (code === "unauthorized") return t("errors.unauthorized");
    return t("error");
  }

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    setError(null);
    startTransition(async () => {
      const res = await setAppLocale(next);
      if (!res.ok) {
        setError(messageForLocaleError(res.error));
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <label htmlFor="app-locale" className="block text-xs text-text-secondary">
        {t("label")}
      </label>
      <select
        id="app-locale"
        defaultValue={defaultLocale}
        disabled={pending}
        onChange={onChange}
        className="h-10 w-full max-w-md bg-field border border-border-subtle px-3 text-sm text-text-primary focus:outline-none focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus/25 disabled:opacity-60"
      >
        {routing.locales.map((loc) => (
          <option key={loc} value={loc}>
            {tLang(loc)}
          </option>
        ))}
      </select>
      <p className="text-xs text-text-tertiary leading-relaxed">{t("hint")}</p>
      {pending ? (
        <p className="text-xs text-text-tertiary" aria-live="polite">
          {t("saving")}
        </p>
      ) : null}
      {error ? (
        <p className="text-xs text-danger" role="alert">
          {t("error")}
        </p>
      ) : null}
    </div>
  );
}
