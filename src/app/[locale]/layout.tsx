import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { LocaleHtmlAttributes } from "@/components/i18n/locale-html-attributes";
import { APP_TIME_ZONE } from "@/lib/i18n/time-zone";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { resolveLocaleFontClasses } from "./fonts/resolve-locale-font";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();
  const localeFontClasses = await resolveLocaleFontClasses(locale);

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      timeZone={APP_TIME_ZONE}
    >
      <LocaleHtmlAttributes />
      <div className={cn(localeFontClasses, "min-h-screen")}>{children}</div>
    </NextIntlClientProvider>
  );
}
