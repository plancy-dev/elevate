"use client";

import { useLocale } from "next-intl";
import { useEffect } from "react";

/** Syncs <html lang> with the active next-intl locale (root layout defaults to en). */
export function LocaleHtmlAttributes() {
  const locale = useLocale();

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
