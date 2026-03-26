import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ko", "zh-CN", "zh-TW", "ja"],
  defaultLocale: "en",
  localePrefix: "as-needed",
  /**
   * If true, next-intl redirects `/` → `/ko` (etc.) from the Accept-Language / cookie.
   * That HTTP redirect drops the URL hash, which breaks Supabase recovery links that
   * land on the site root (`redirect_to` = Site URL). Users still pick a locale via
   * the header language switcher (and can bookmark `/ko`, etc.).
   */
  localeDetection: false,
});
