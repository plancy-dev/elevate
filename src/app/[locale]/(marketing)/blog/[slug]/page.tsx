import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { MDXRemote } from "next-mdx-remote/rsc";
import { Link, getPathname } from "@/i18n/navigation";
import { blogMdxComponents } from "@/components/blog/mdx-components";
import { getAllPostMetaForLocale, getPostBySlug } from "@/lib/blog/posts";
import { routing } from "@/i18n/routing";
import { buildBlogPostAlternatesLanguages } from "@/lib/seo/locale-alternates";
import {
  organizationJsonLdId,
  websiteJsonLdId,
} from "@/lib/seo/site-jsonld";
import { getSiteUrl } from "@/lib/seo/site-url";
import { BlogPostViewedCapture } from "@/components/blog/blog-post-viewed-capture";
import { BlogShareLinkButton } from "@/components/blog/blog-share-link-button";

type Props = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  const out: { locale: string; slug: string }[] = [];
  for (const locale of routing.locales) {
    for (const post of getAllPostMetaForLocale(locale)) {
      out.push({ locale, slug: post.slug });
    }
  }
  return out;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = getPostBySlug(slug, locale);
  if (!post) {
    const tMeta = await getTranslations({ locale, namespace: "Metadata" });
    return { title: tMeta("pageTitles.blog") };
  }
  const pathname = getPathname({
    locale,
    href: `/blog/${slug}` as never,
  });
  const canonicalUrl = `${getSiteUrl()}${pathname}`;
  const languageAlternates = buildBlogPostAlternatesLanguages(slug);
  const published = `${post.meta.date}T12:00:00.000Z`;
  const ogImagePath = post.meta.ogImage ?? "/og-default.webp";
  const ogImages = [
    {
      url: ogImagePath,
      width: 1200,
      height: 630,
      alt: post.meta.title,
    },
  ];
  return {
    title: post.meta.title,
    description: post.meta.description || undefined,
    alternates: {
      canonical: canonicalUrl,
      ...(languageAlternates ? { languages: languageAlternates } : {}),
    },
    openGraph: {
      title: post.meta.title,
      description: post.meta.description || undefined,
      url: canonicalUrl,
      siteName: "Elevate",
      type: "article",
      publishedTime: published,
      modifiedTime: published,
      locale,
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title: post.meta.title,
      description: post.meta.description || undefined,
      images: ogImages.map((i) => i.url),
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const post = getPostBySlug(slug, locale);
  if (!post) notFound();

  const t = await getTranslations("Blog");
  const base = getSiteUrl();
  const pathname = getPathname({
    locale,
    href: `/blog/${slug}` as never,
  });
  const canonicalUrl = `${base}${pathname}`;
  const imagePath = post.meta.ogImage ?? "/og-default.webp";
  const imageUrl = `${base}${imagePath.startsWith("/") ? imagePath : `/${imagePath}`}`;
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.meta.title,
    inLanguage: locale === "zh-CN" ? "zh-CN" : locale === "zh-TW" ? "zh-TW" : locale,
    datePublished: `${post.meta.date}T12:00:00.000Z`,
    dateModified: `${post.meta.date}T12:00:00.000Z`,
    image: imageUrl,
    mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
    isPartOf: { "@id": websiteJsonLdId(base), "@type": "WebSite" },
    publisher: {
      "@type": "Organization",
      "@id": organizationJsonLdId(base),
      name: "Elevate",
      url: base,
    },
  };
  if (post.meta.description) {
    jsonLd.description = post.meta.description;
  }

  return (
    <div className="border-t border-ink-100">
      <BlogPostViewedCapture
        slug={slug}
        locale={locale}
        title={post.meta.title}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="mx-auto max-w-[min(45rem,100%)] px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-xs text-ink-500">
          <time dateTime={post.meta.date}>
            {t("published", { date: post.meta.date })}
          </time>
        </p>
        <h1 className="mt-2 text-[length:var(--elevate-prose-hero-title-size)] font-semibold leading-[1.15] tracking-tight text-ink-900">
          {post.meta.title}
        </h1>
        {post.meta.description ? (
          <p className="mt-3 text-[length:var(--elevate-prose-body-size)] leading-relaxed text-ink-700">
            {post.meta.description}
          </p>
        ) : null}

        <BlogShareLinkButton
          url={canonicalUrl}
          slug={slug}
          locale={locale}
          title={post.meta.title}
        />

        <div className="mt-10 prose-blog">
          <MDXRemote source={post.body} components={blogMdxComponents} />
        </div>

        <div className="mt-14 border-t border-ink-100 pt-8">
          <Link
            href="/blog"
            className="text-sm font-medium text-vermilion-600 hover:underline"
          >
            {t("backToBlog")}
          </Link>
        </div>
      </article>
    </div>
  );
}
