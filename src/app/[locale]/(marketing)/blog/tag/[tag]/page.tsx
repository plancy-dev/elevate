import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Link, getPathname } from "@/i18n/navigation";
import { MarketingSection } from "@/components/marketing/marketing-section";
import {
  getAllTagsForLocale,
  getPostsByTagForLocale,
} from "@/lib/blog/posts";
import { routing } from "@/i18n/routing";
import { getSiteUrl } from "@/lib/seo/site-url";

type Props = { params: Promise<{ locale: string; tag: string }> };

/** Pre-render all (locale, tag) combinations for static gen + sitemap-friendly. */
export function generateStaticParams() {
  const out: { locale: string; tag: string }[] = [];
  for (const locale of routing.locales) {
    for (const tag of getAllTagsForLocale(locale)) {
      out.push({ locale, tag: encodeURIComponent(tag) });
    }
  }
  return out;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, tag: encodedTag } = await params;
  const tag = decodeURIComponent(encodedTag);
  const posts = getPostsByTagForLocale(tag, locale);
  if (posts.length === 0) {
    return { title: "Tag not found — Elevate" };
  }
  const base = getSiteUrl();
  const pathname = getPathname({
    locale,
    href: `/blog/tag/${encodedTag}` as never,
  });
  const canonicalUrl = `${base}${pathname}`;
  const titleByLocale: Record<string, string> = {
    en: `Posts tagged "${tag}" — Elevate`,
    ko: `"${tag}" 태그 글 — Elevate`,
    ja: `"${tag}" タグの記事 — Elevate`,
    "zh-CN": `"${tag}" 标签文章 — Elevate`,
    "zh-TW": `"${tag}" 標籤文章 — Elevate`,
  };
  return {
    title: titleByLocale[locale] ?? titleByLocale.en!,
    description: `${posts.length} posts on Elevate Studio blog tagged "${tag}".`,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: titleByLocale[locale] ?? titleByLocale.en!,
      url: canonicalUrl,
      siteName: "Elevate",
      type: "website",
      locale,
    },
  };
}

export default async function BlogTagPage({ params }: Props) {
  const { locale, tag: encodedTag } = await params;
  setRequestLocale(locale);
  const tag = decodeURIComponent(encodedTag);
  const posts = getPostsByTagForLocale(tag, locale);
  if (posts.length === 0) notFound();

  const titleByLocale: Record<string, string> = {
    en: `Posts tagged "${tag}"`,
    ko: `"${tag}" 태그 글`,
    ja: `"${tag}" タグの記事`,
    "zh-CN": `"${tag}" 标签文章`,
    "zh-TW": `"${tag}" 標籤文章`,
  };
  const backLabel: Record<string, string> = {
    en: "← All posts",
    ko: "← 전체 글",
    ja: "← すべての記事",
    "zh-CN": "← 全部文章",
    "zh-TW": "← 全部文章",
  };

  return (
    <div className="border-t border-ink-100">
      <MarketingSection
        title={titleByLocale[locale] ?? titleByLocale.en!}
        description={`${posts.length} ${posts.length === 1 ? "post" : "posts"}`}
      />

      <div className="elevate-marketing-shell pb-12 sm:pb-16">
        <nav className="mb-6">
          <Link
            href="/blog"
            className="text-sm font-medium text-vermilion-600 hover:underline"
          >
            {backLabel[locale] ?? backLabel.en!}
          </Link>
        </nav>

        <ul className="space-y-8">
          {posts.map((post) => (
            <li
              key={post.slug}
              className="border-b border-ink-100 pb-6 last:border-b-0"
            >
              <article>
                <p className="text-xs text-ink-500">
                  <time dateTime={post.date}>{post.date}</time>
                  <span aria-hidden="true"> · </span>
                  <span>{post.readingMinutes} min read</span>
                </p>
                <h2 className="mt-1 text-xl font-semibold text-ink-900">
                  <Link
                    href={`/blog/${post.slug}` as never}
                    className="hover:text-vermilion-600"
                  >
                    {post.title}
                  </Link>
                </h2>
                {post.description ? (
                  <p className="mt-2 text-sm leading-relaxed text-ink-700">
                    {post.description}
                  </p>
                ) : null}
                {post.tags && post.tags.length > 0 ? (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {post.tags.map((t) => (
                      <li
                        key={t}
                        className={`rounded-full px-2.5 py-0.5 text-xs ${
                          t === tag
                            ? "bg-vermilion-100 text-vermilion-700"
                            : "bg-ink-50 text-ink-600"
                        }`}
                      >
                        {t}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
