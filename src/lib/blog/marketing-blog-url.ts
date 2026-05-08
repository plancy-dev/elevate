/**
 * Parsing helpers for public marketing blog URLs (next-intl, localePrefix `as-needed`).
 * EN default-locale paths omit the locale segment: `/blog/slug` not `/en/blog/slug`.
 */
const MARKETING_BLOG_PATH_RE =
  /^\/(?:([\w-]+)\/)?blog\/([a-z0-9]+(?:-[a-z0-9]+)*)$/;

export function parseMarketingBlogPathname(
  pathname: string,
): { locale: string; slug: string } | null {
  const normalized = (pathname.split("?")[0] ?? "").replace(/\/$/, "") || "/";
  const m = normalized.match(MARKETING_BLOG_PATH_RE);
  if (!m) return null;
  return { locale: m[1] ?? "en", slug: m[2] };
}

export function extractLocHrefsFromSitemapXml(xml: string): string[] {
  const out: string[] = [];
  const re = /<loc>([^<]*)<\/loc>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const s = m[1]?.trim();
    if (s) out.push(s);
  }
  return out;
}
