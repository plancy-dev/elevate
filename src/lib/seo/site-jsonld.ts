import "server-only";
import { routing } from "@/i18n/routing";
import { getSiteUrl } from "@/lib/seo/site-url";

const ORG_NAME = "Elevate";
const SITE_NAME = "Elevate AI";

export function organizationJsonLdId(base: string): string {
  return `${base}/#organization`;
}

export function websiteJsonLdId(base: string): string {
  return `${base}/#website`;
}

/**
 * Organization + WebSite JSON-LD for marketing shell (`@graph`).
 * `WebSite.url` is the site origin; `inLanguage` reflects the current locale page.
 */
export function buildMarketingSiteJsonLd(locale: string): Record<string, unknown> {
  const base = getSiteUrl();
  const locales = routing.locales as readonly string[];
  const loc = locales.includes(locale) ? locale : routing.defaultLocale;
  const orgId = organizationJsonLdId(base);
  const webId = websiteJsonLdId(base);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": orgId,
        name: ORG_NAME,
        url: base,
        logo: `${base}/icon.svg`,
      },
      {
        "@type": "WebSite",
        "@id": webId,
        name: SITE_NAME,
        url: base,
        inLanguage: hreflangForSchema(loc),
        publisher: { "@id": orgId },
      },
    ],
  };
}

function hreflangForSchema(locale: string): string {
  if (locale === "zh-CN") return "zh-CN";
  if (locale === "zh-TW") return "zh-TW";
  if (locale === "ja") return "ja";
  if (locale === "ko") return "ko";
  return "en";
}
