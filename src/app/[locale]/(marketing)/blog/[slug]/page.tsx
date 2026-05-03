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
