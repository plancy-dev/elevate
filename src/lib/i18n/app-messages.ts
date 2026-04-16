import type { AbstractIntlMessages } from "next-intl";
import { routing } from "@/i18n/routing";
import en from "../../../messages/en.json";
import { mergeLocaleMessages } from "@/lib/i18n/merge-locale-messages";

export async function loadMessagesForLocale(
  locale: string,
): Promise<AbstractIntlMessages> {
  const primary = (await import(`../../../messages/${locale}.json`))
    .default as AbstractIntlMessages;
  if (locale === routing.defaultLocale) return primary;
  return mergeLocaleMessages(
    en as unknown as AbstractIntlMessages,
    primary,
  );
}
