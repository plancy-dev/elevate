import { getSiteUrl } from "@/lib/seo/site-url";

/**
 * Dynamic `llms.txt` so the origin follows `NEXT_PUBLIC_APP_URL` in every environment.
 * Replaces a static `public/llms.txt` (removed to avoid duplicate routes).
 */
export function GET(): Response {
  const base = getSiteUrl();
  const body = `# Elevate AI
# See https://llmstxt.org for conventions.

Site: ${base}
Sitemap: ${base}/sitemap.xml
Robots: ${base}/robots.txt

Public locales: en, ko, ja, zh-CN, zh-TW (path prefixes per next-intl).
Dashboard and admin routes are disallowed in robots.txt.
`;
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
