import { getPathname } from "@/i18n/navigation";
import { getAllPostMetaForLocale } from "@/lib/blog/posts";
import { getSiteUrl } from "@/lib/seo/site-url";
import { routing } from "@/i18n/routing";

const FEED_TITLE = "Elevate AI — Blog";
const FEED_SUBTITLE =
  "Prompt improvement, product updates, and growth notes.";

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g,"&quot;");
}

/** Atom 1.0 — default-locale blog only (`en`); add `/ko/feed.xml` etc. if product needs per-locale feeds. */
export function GET(): Response {
  const base = getSiteUrl();
  const locale = routing.defaultLocale;
  const posts = getAllPostMetaForLocale(locale);

  const blogIndexPath = getPathname({ locale, href: "/blog" as never });
  const blogIndexUrl = `${base}${blogIndexPath}`;
  const selfUrl = `${base}/feed.xml`;

  let latest = "";
  for (const p of posts) {
    const iso = `${p.date}T12:00:00.000Z`;
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
      const updated = `${post.date}T12:00:00.000Z`;
      return `  <entry>
    <title>${escapeXml(post.title)}</title>
    <link href="${escapeXml(url)}" rel="alternate" type="text/html"/>
    <id>${escapeXml(url)}</id>
    <updated>${updated}</updated>
    <published>${updated}</published>
    <summary type="text">${escapeXml(post.description)}</summary>
  </entry>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
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
