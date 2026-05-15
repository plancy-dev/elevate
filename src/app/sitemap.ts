import type { MetadataRoute } from "next";
import { getPathname } from "@/i18n/navigation";
import {
  getAllTagsForLocale,
  getIndexablePostMetaForLocale,
} from "@/lib/blog/posts";
import {
  buildBlogPostAlternatesLanguages,
  buildPathAlternatesLanguages,
} from "@/lib/seo/locale-alternates";
import { getSiteUrl } from "@/lib/seo/site-url";
import { routing } from "@/i18n/routing";

const STATIC_PATHS: string[] = [
  "/",
  "/blog",
  "/product",
  "/pricing",
  "/contact",
  "/solutions",
  "/about",
  "/careers",
  "/case-studies",
  "/demo",
  "/privacy",
  "/terms",
  "/security",
  "/compliance",
  "/product/prompt-studio",
  "/product/ebooks-and-guides",
  "/product/org-workspace",
  "/product/security",
  "/solutions/conferences",
  "/solutions/exhibitions",
  "/solutions/incentive-travel",
  "/solutions/corporate-meetings",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    for (const path of STATIC_PATHS) {
      const pathname = getPathname({
        locale,
        href: path as never,
      });
      entries.push({
        url: `${base}${pathname}`,
        changeFrequency: path === "/" ? "weekly" : "monthly",
        priority: path === "/" ? 1 : 0.7,
        alternates: { languages: buildPathAlternatesLanguages(path) },
      });
    }

    // noindex posts (frontmatter `noindex: true`) excluded from sitemap.
    // Used for stub posts in JA/zh-CN/zh-TW until substantive translation.
    for (const post of getIndexablePostMetaForLocale(locale)) {
      const pathname = getPathname({
        locale,
        href: `/blog/${post.slug}` as never,
      });
      const languages = buildBlogPostAlternatesLanguages(post.slug);
      // Use post.modified if set (frontmatter explicit), else fall back to date.
      const lastModified = new Date(
        `${post.modified ?? post.date}T12:00:00Z`,
      );
      entries.push({
        url: `${base}${pathname}`,
        lastModified,
        changeFrequency: "monthly",
        priority: 0.65,
        ...(languages ? { alternates: { languages } } : {}),
      });
    }

    // Tag pages (long-tail SEO + internal linking surfaces)
    for (const tag of getAllTagsForLocale(locale)) {
      const pathname = getPathname({
        locale,
        href: `/blog/tag/${encodeURIComponent(tag)}` as never,
      });
      entries.push({
        url: `${base}${pathname}`,
        changeFrequency: "weekly",
        priority: 0.5,
      });
    }
  }

  return entries;
}
