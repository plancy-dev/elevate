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

      <div className="mx-auto max-w-[960px] px-4 pb-16 lg:px-8">
        {posts.length === 0 ? (
          <p className="text-sm text-text-secondary">{t("empty")}</p>
        ) : (
          <ul className="grid gap-px bg-marketing-border-subtle border border-marketing-border-subtle rounded-sm overflow-hidden">
            {posts.map((post) => (
              <li key={post.slug} className="bg-layer-01">
                <Link
                  href={`/blog/${post.slug}`}
                  className="block p-6 hover:bg-layer-02 transition-colors"
                >
                  <time
                    dateTime={post.date}
                    className="text-xs text-text-tertiary tabular-nums"
                  >
                    {t("published", { date: post.date })}
                  </time>
                  <h2 className="mt-1 text-lg font-semibold text-text-primary">
                    {post.title}
                  </h2>
                  {post.description ? (
                    <p className="mt-2 text-sm text-text-secondary leading-relaxed line-clamp-2">
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
  );
}
