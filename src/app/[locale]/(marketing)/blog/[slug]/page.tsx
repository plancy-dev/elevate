import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { MDXRemote } from "next-mdx-remote/rsc";
import { Link, getPathname } from "@/i18n/navigation";
import {
  MarketingTrackedLocaleLink,
} from "@/components/analytics/marketing-tracked-links";
import { MarketingCtaId } from "@/lib/analytics/posthog-events";
import { blogMdxComponents } from "@/components/blog/mdx-components";
import {
  getAllPostMetaForLocale,
  getPostBySlug,
  getRelatedPostsForLocale,
} from "@/lib/blog/posts";
import { routing } from "@/i18n/routing";
import { buildBlogPostAlternatesLanguages } from "@/lib/seo/locale-alternates";
import {
  organizationJsonLdId,
  websiteJsonLdId,
} from "@/lib/seo/site-jsonld";
import { getSiteUrl } from "@/lib/seo/site-url";
import { BlogPostViewedCapture } from "@/components/blog/blog-post-viewed-capture";
import { BlogShareLinkButton } from "@/components/blog/blog-share-link-button";
import { BlogPaywallCta } from "@/components/blog/blog-paywall-cta";
import { createClient } from "@/lib/supabase/server";
import {
  buildBlogSubscriptionCheckoutUrl,
  canReadBlogPost,
  getBlogSubscriptionByUserId,
  POLAR_ANNUAL_PRODUCT_ID,
  POLAR_MONTHLY_PRODUCT_ID,
} from "@/lib/subscriptions/blog-subscription";

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
  // Use modified frontmatter if set; otherwise fall back to date.
  // Decoupling improves Google's freshness signal for edited posts.
  const modified = post.meta.modified
    ? `${post.meta.modified}T12:00:00.000Z`
    : published;
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
      modifiedTime: modified,
      locale,
      images: ogImages,
      ...(post.meta.tags ? { tags: post.meta.tags } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: post.meta.title,
      description: post.meta.description || undefined,
      images: ogImages.map((i) => i.url),
    },
    // noindex frontmatter → robots meta noindex (stub posts, thin content)
    ...(post.meta.noindex
      ? {
          robots: {
            index: false,
            follow: false,
            googleBot: { index: false, follow: false },
          },
        }
      : {}),
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const post = getPostBySlug(slug, locale);
  if (!post) notFound();

  const t = await getTranslations("Blog");
  const tWaitlist = await getTranslations("Waitlist");
  const tNav = await getTranslations("Nav");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const subscription = await getBlogSubscriptionByUserId(supabase, user?.id ?? null);
  const access = canReadBlogPost({
    accessTier: post.meta.accessTier,
    isAuthenticated: Boolean(user),
    subscription,
  });
  const monthlyCheckoutUrl = buildBlogSubscriptionCheckoutUrl({
    productId: POLAR_MONTHLY_PRODUCT_ID,
    email: user?.email,
  });
  const annualCheckoutUrl = buildBlogSubscriptionCheckoutUrl({
    productId: POLAR_ANNUAL_PRODUCT_ID,
    email: user?.email,
  });
  const base = getSiteUrl();
  const pathname = getPathname({
    locale,
    href: `/blog/${slug}` as never,
  });
  const canonicalUrl = `${base}${pathname}`;
  const imagePath = post.meta.ogImage ?? "/og-default.webp";
  const imageUrl = `${base}${imagePath.startsWith("/") ? imagePath : `/${imagePath}`}`;
  const inLanguage =
    locale === "zh-CN" ? "zh-CN" : locale === "zh-TW" ? "zh-TW" : locale;
  const datePublished = `${post.meta.date}T12:00:00.000Z`;
  const dateModified = post.meta.modified
    ? `${post.meta.modified}T12:00:00.000Z`
    : datePublished;

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.meta.title,
    inLanguage,
    datePublished,
    dateModified,
    image: imageUrl,
    mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
    isPartOf: { "@id": websiteJsonLdId(base), "@type": "WebSite" },
    publisher: {
      "@type": "Organization",
      "@id": organizationJsonLdId(base),
      name: "Elevate",
      url: base,
    },
    // E-E-A-T author signal (ADR-024 founder framing)
    author: {
      "@type": "Person",
      name: "조윤환",
      url: base,
    },
    wordCount: post.meta.wordCount,
    timeRequired: `PT${post.meta.readingMinutes}M`,
  };
  if (post.meta.description) {
    jsonLd.description = post.meta.description;
  }
  if (post.meta.tags && post.meta.tags.length > 0) {
    jsonLd.keywords = post.meta.tags.join(", ");
    jsonLd.articleSection = post.meta.tags[0]; // Primary tag = section
  }

  // BreadcrumbList JSON-LD (internal navigation + Google rich snippet)
  const blogIndexUrl = `${base}${getPathname({
    locale,
    href: "/blog" as never,
  })}`;
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${base}${getPathname({ locale, href: "/" as never })}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: blogIndexUrl,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.meta.title,
        item: canonicalUrl,
      },
    ],
  };

  // Related posts (same locale, tag intersection)
  const relatedPosts = getRelatedPostsForLocale(slug, locale, 3);

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <article className="mx-auto max-w-[min(45rem,100%)] px-4 py-10 sm:px-6 lg:px-8">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-500">
          <time dateTime={post.meta.date}>
            {t("published", { date: post.meta.date })}
          </time>
          <span aria-hidden="true">·</span>
          <span>{post.meta.readingMinutes} min read</span>
        </p>
        <h1 className="mt-2 text-(length:--elevate-prose-hero-title-size) font-semibold leading-[1.15] tracking-tight text-ink-900">
          {post.meta.title}
        </h1>
        {post.meta.description ? (
          <p className="mt-3 text-(length:--elevate-prose-body-size) leading-relaxed text-ink-700">
            {post.meta.description}
          </p>
        ) : null}

        <BlogShareLinkButton
          url={canonicalUrl}
          slug={slug}
          locale={locale}
          title={post.meta.title}
        />

        {access.canReadFull ? (
          <div className="mt-10 prose-blog">
            <MDXRemote source={post.body} components={blogMdxComponents} />
          </div>
        ) : (
          <>
            <div className="relative isolate mt-10">
              <div className="prose-blog max-h-136 overflow-hidden">
                <MDXRemote source={post.body} components={blogMdxComponents} />
              </div>
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-40 bg-linear-to-t from-paper-50 via-paper-50/95 to-transparent"
              />
            </div>
            <BlogPaywallCta
              {...(access.requiredAccessTier === "member"
                ? { mode: "member" as const, isAuthenticated: Boolean(user) }
                : {
                    mode: "premium" as const,
                    isAuthenticated: Boolean(user),
                    monthlyCheckoutUrl,
                    annualCheckoutUrl,
                  })}
            />
          </>
        )}

        {/* Tags (frontmatter-driven, surfaces tag pages) */}
        {post.meta.tags && post.meta.tags.length > 0 ? (
          <div className="mt-10 flex flex-wrap gap-2">
            {post.meta.tags.map((tag) => (
              <Link
                key={tag}
                href={`/blog/tag/${encodeURIComponent(tag)}` as never}
                className="rounded-full bg-ink-50 px-2.5 py-0.5 text-xs text-ink-600 hover:bg-ink-100"
              >
                {tag}
              </Link>
            ))}
          </div>
        ) : null}

        {/* Related posts (tag intersection, same-locale, exclude noindex) */}
        {relatedPosts.length > 0 ? (
          <section className="mt-14 border-t border-ink-100 pt-8">
            <h2 className="text-base font-semibold text-ink-900">
              {locale === "ko"
                ? "이어서 보면 좋은 글"
                : locale === "ja"
                  ? "次に読むと良い記事"
                  : locale.startsWith("zh")
                    ? "继续阅读推荐"
                    : "Continue reading"}
            </h2>
            <ul className="mt-5 space-y-5">
              {relatedPosts.map((rp) => (
                <li
                  key={rp.slug}
                  className="border-b border-ink-100 pb-4 last:border-b-0"
                >
                  <div className="text-xs text-ink-500">
                    <time dateTime={rp.date}>{rp.date}</time>
                    <span aria-hidden="true"> · </span>
                    <span>{rp.readingMinutes} min</span>
                  </div>
                  <h3 className="mt-1 text-base font-semibold text-ink-900">
                    <Link
                      href={`/blog/${rp.slug}` as never}
                      className="hover:text-vermilion-600"
                    >
                      {rp.title}
                    </Link>
                  </h3>
                  {rp.description ? (
                    <p className="mt-1 text-sm text-ink-600">
                      {rp.description}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="mt-14 border-t border-ink-100 pt-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-2">
            <MarketingTrackedLocaleLink
              href="/#waitlist"
              ctaId={MarketingCtaId.BLOG_POST_FOOTER_WAITLIST}
              eventProperties={{ slug }}
              className="text-sm font-medium text-vermilion-600 hover:underline"
            >
              {tWaitlist("submit")}
            </MarketingTrackedLocaleLink>
            <MarketingTrackedLocaleLink
              href="/pricing"
              ctaId={MarketingCtaId.BLOG_POST_FOOTER_PRICING}
              eventProperties={{ slug }}
              className="text-sm font-medium text-vermilion-600 hover:underline"
            >
              {tNav("pricing")}
            </MarketingTrackedLocaleLink>
            <Link
              href="/blog"
              className="text-sm font-medium text-vermilion-600 hover:underline"
            >
              {t("backToBlog")}
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
