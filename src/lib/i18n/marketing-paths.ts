import { routing } from "@/i18n/routing";

type AppLocale = (typeof routing.locales)[number];

/** Marketing URLs: default locale has no prefix (`localePrefix: "as-needed"`). */
export function marketingHomePath(locale: AppLocale): string {
  return locale === routing.defaultLocale ? "/" : `/${locale}`;
}

export function marketingContactPath(locale: AppLocale): string {
  return locale === routing.defaultLocale ? "/contact" : `/${locale}/contact`;
}

/** Fragment for waitlist anchor on home. */
export function marketingWaitlistHref(locale: AppLocale): string {
  return `${marketingHomePath(locale)}#waitlist`;
}
