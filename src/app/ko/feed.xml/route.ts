import { getPathname } from "@/i18n/navigation";
import { getIndexablePostMetaForLocale } from "@/lib/blog/posts";
import { getSiteUrl } from "@/lib/seo/site-url";

const FEED_TITLE = "Elevate AI — 블로그";
const FEED_SUBTITLE = "Studio 운영 노트, 인디 빌더 인사이트.";

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Atom 1.0 — KO locale. noindex posts excluded. */
export function GET(): Response {
  const base = getSiteUrl();
  const locale = "ko";
  const posts = getIndexablePostMetaForLocale(locale);

  const blogIndexPath = getPathname({ locale, href: "/blog" as never });
  const blogIndexUrl = `${base}${blogIndexPath}`;
  const selfUrl = `${base}/ko/feed.xml`;

  let latest = "";
  for (const p of posts) {
    const iso = `${p.modified ?? p.date}T12:00:00.000Z`;
    if (iso > latest) latest = iso;
  }
  if (!latest) {
    latest = new Date().toISOString();
  }

  const entries = posts
    .map((post) => {
      const pathname = getPathname({
        locale,
        href: `/blog/${post.slug}` as never,
      });
      const url = `${base}${pathname}`;
      const published = `${post.date}T12:00:00.000Z`;
      const updated = `${post.modified ?? post.date}T12:00:00.000Z`;
      return `  <entry>
    <title>${escapeXml(post.title)}</title>
    <link href="${escapeXml(url)}" rel="alternate" type="text/html"/>
    <id>${escapeXml(url)}</id>
    <updated>${updated}</updated>
    <published>${published}</published>
    <summary type="text">${escapeXml(post.description)}</summary>
  </entry>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="ko">
  <title>${escapeXml(FEED_TITLE)}</title>
  <subtitle>${escapeXml(FEED_SUBTITLE)}</subtitle>
  <link href="${escapeXml(selfUrl)}" rel="self" type="application/atom+xml"/>
  <link href="${escapeXml(blogIndexUrl)}" rel="alternate" type="text/html"/>
  <updated>${latest}</updated>
  <id>${escapeXml(selfUrl)}</id>
${entries}
</feed>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/atom+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
