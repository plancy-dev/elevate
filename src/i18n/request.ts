import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { getAppLocale } from "@/lib/i18n/app-locale";
import { APP_TIME_ZONE } from "@/lib/i18n/time-zone";
import { routing } from "./routing";

/**
 * next-intl request config.
 *
 * - Routes under `/[locale]/…` receive `requestLocale` from the URL segment (marketing site).
 * - Routes without a locale segment (`/dashboard`, `/admin`, `/login`, …) do **not** set
 *   `requestLocale` reliably before the first `getTranslations` on the server, so the
 *   config would fall back to `defaultLocale` (en) while `NextIntlClientProvider` in the
 *   dashboard layout still had Korean messages — sidebar translated, RSC body did not.
 *   For those routes we resolve locale via `getAppLocale()` (profile `ui_locale` + cookie).
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : await getAppLocale();

  return {
    locale,
    timeZone: APP_TIME_ZONE,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
