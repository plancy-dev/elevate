import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ko", "zh-CN", "zh-TW", "ja"],
  defaultLocale: "en",
  localePrefix: "as-needed",
  localeDetection: true,
});
