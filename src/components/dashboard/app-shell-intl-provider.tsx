"use client";

import type { AbstractIntlMessages } from "next-intl";
import { NextIntlClientProvider } from "next-intl";
import { DashboardLocaleSync } from "@/components/dashboard/dashboard-locale-sync";
import { APP_TIME_ZONE } from "@/lib/i18n/time-zone";

export function AppShellIntlProvider({
  locale,
  messages,
  children,
}: {
  locale: string;
  messages: AbstractIntlMessages;
  children: React.ReactNode;
}) {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      timeZone={APP_TIME_ZONE}
    >
      <DashboardLocaleSync />
      {children}
    </NextIntlClientProvider>
  );
}
