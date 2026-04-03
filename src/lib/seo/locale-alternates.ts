/**
 * Server-oriented hreflang helpers (`getPathname` / next-intl). Use from Server Components,
 * `sitemap.ts`, and route handlers only — not from client bundles or Vitest without a Next shim.
 */
import { getPathname } from "@/i18n/navigation";
import { getPostBySlug } from "@/lib/blog/posts";
import { routing } from "@/i18n/routing";
import { getSiteUrl } from "@/lib/seo/site-url";

/**
 * BCP 47 codes for `hreflang` — matches `routing.locales` (next-intl).
 * `zh-CN` / `zh-TW` are valid; do not map to `zh-Hans` unless product requires it.
 */
export function hreflangForLocale(locale: string): string {
  return locale;
}

/**
 * Absolute URLs for every locale for the same path template (e.g. `/blog`, `/product`).
 * Includes `x-default` → default locale URL (English with `localePrefix: as-needed`).
 */
export function buildPathAlternatesLanguages(href: string): Record<string, string> {
  const base = getSiteUrl();
  const languages: Record<string, string> = {};

  for (const locale of routing.locales) {
    const pathname = getPathname({
      locale,
      href: href as never,
    });
    languages[hreflangForLocale(locale)] = `${base}${pathname}`;
  }

  const defaultPath = getPathname({
    locale: routing.defaultLocale,
    href: href as never,
  });
  languages["x-default"] = `${base}${defaultPath}`;

  return languages;
}

/**
 * Blog post alternates: only locales where `content/blog/<locale>/<slug>.mdx` exists.
 * `x-default` prefers the default locale’s URL if present, else the first available.
 */
export function buildBlogPostAlternatesLanguages(
  slug: string,
): Record<string, string> | null {
  const base = getSiteUrl();
  const languages: Record<string, string> = {};

  for (const locale of routing.locales) {
    if (!getPostBySlug(slug, locale)) continue;
    const pathname = getPathname({
      locale,
      href: `/blog/${slug}` as never,
    });
    languages[hreflangForLocale(locale)] = `${base}${pathname}`;
  }

  if (Object.keys(languages).length === 0) {
    return null;
  }

  const defaultHreflang = hreflangForLocale(routing.defaultLocale);
  const defaultUrl = languages[defaultHreflang];
  if (defaultUrl) {
    languages["x-default"] = defaultUrl;
  } else {
    const first = Object.values(languages)[0];
    if (first) {
      languages["x-default"] = first;
    }
  }

  return languages;
}
