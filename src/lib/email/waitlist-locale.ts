import { routing } from "@/i18n/routing";

export type AppLocale = (typeof routing.locales)[number];

const LOCALES = new Set<string>(routing.locales);

/**
 * Maps waitlist POST `locale` to a supported app locale for email copy.
 */
export function resolveWaitlistEmailLocale(
  raw: string | null | undefined,
): AppLocale {
  if (!raw) return "en";
  const t = raw.trim();
  if (LOCALES.has(t)) return t as AppLocale;
  return "en";
}
