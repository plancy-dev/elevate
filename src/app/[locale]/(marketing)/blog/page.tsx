import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Link, getPathname } from "@/i18n/navigation";
import { MarketingSection } from "@/components/marketing/marketing-section";
import { getAllPostMetaForLocale } from "@/lib/blog/posts";
import { buildPathAlternatesLanguages } from "@/lib/seo/locale-alternates";
import { getSiteUrl } from "@/lib/seo/site-url";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Blog" });
  const pathname = getPathname({ locale, href: "/blog" as never });
  const canonicalUrl = `${getSiteUrl()}${pathname}`;
  return {
    title: t("metaTitle"),
    description: t("description"),
    alternates: {
      canonical: canonicalUrl,
      languages: buildPathAlternatesLanguages("/blog"),
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: canonicalUrl,
      siteName: "Elevate",
      type: "website",
      locale,
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
    },
  };
}

export default async function BlogPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Blog");
  const posts = getAllPostMetaForLocale(locale);

  return (
    <div className="border-t border-marketing-border-subtle">
      <MarketingSection title={t("title")} description={t("description")} />

      <div className="elevate-marketing-shell pb-12 sm:pb-16">
        <div className="mx-auto w-full max-w-[min(60rem,100%)]">
        {posts.length === 0 ? (
          <p className="text-[length:var(--elevate-prose-body-size)] text-text-secondary">
            {t("empty")}
          </p>
        ) : (
          <ul className="grid gap-px overflow-hidden rounded-md border border-marketing-border-subtle bg-marketing-border-subtle">
            {posts.map((post) => (
              <li key={post.slug} className="elevate-cv-list-item bg-layer-01">
                <Link
                  href={`/blog/${post.slug}`}
                  className="block p-5 sm:p-6 hover:bg-layer-02 transition-colors"
                >
                  <time
                    dateTime={post.date}
                    className="text-xs text-text-tertiary tabular-nums"
                  >
                    {t("published", { date: post.date })}
                  </time>
                  <h2 className="mt-1 text-[length:var(--elevate-marketing-list-title-size)] font-semibold leading-snug text-text-primary">
                    {post.title}
                  </h2>
                  {post.description ? (
                    <p className="mt-2 line-clamp-2 text-[length:var(--elevate-prose-body-size)] leading-[var(--elevate-prose-body-leading)] text-text-secondary">
                      {post.description}
                    </p>
                  ) : null}
                  <span className="mt-3 inline-block text-sm font-medium text-interactive">
                    {t("readMore")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        </div>
      </div>
    </div>
  );
}
