"use client";

import { useLocale } from "next-intl";
import { useEffect } from "react";

/** Sets document `<html lang>` while using the dashboard/admin locale (not `[locale]` marketing routes). */
export function DashboardLocaleSync() {
  const locale = useLocale();

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
