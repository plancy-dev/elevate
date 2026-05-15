import { getPathname } from "@/i18n/navigation";
import {
  getIndexablePostMetaForLocale,
  getPostBySlug,
} from "@/lib/blog/posts";
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
    .replace(/"/g, "&quot;");
}

/**
 * Strip MDX/markdown to plain text for Atom `<content type="text">`.
 * Full content (vs summary only) improves SEO + RSS reader UX.
 */
function mdxToPlainText(body: string): string {
  return body
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .replace(/[#*_`>!]/g, " ")
    .replace(/\n+/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

/** Atom 1.0 — default-locale blog only (`en`). Per-locale feeds at `/ko/feed.xml` etc. */
export function GET(): Response {
  const base = getSiteUrl();
  const locale = routing.defaultLocale;
  // noindex posts excluded (frontmatter `noindex: true`)
  const posts = getIndexablePostMetaForLocale(locale);

  const blogIndexPath = getPathname({ locale, href: "/blog" as never });
  const blogIndexUrl = `${base}${blogIndexPath}`;
  const selfUrl = `${base}/feed.xml`;

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
      // Full-content Atom — load body, strip to plain text
      const full = getPostBySlug(post.slug, locale);
      const contentPlain = full ? mdxToPlainText(full.body) : post.description;
      return `  <entry>
    <title>${escapeXml(post.title)}</title>
    <link href="${escapeXml(url)}" rel="alternate" type="text/html"/>
    <id>${escapeXml(url)}</id>
    <updated>${updated}</updated>
    <published>${published}</published>
    <summary type="text">${escapeXml(post.description)}</summary>
    <content type="text">${escapeXml(contentPlain)}</content>
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
