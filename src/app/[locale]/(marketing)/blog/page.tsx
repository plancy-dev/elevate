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
    <div className="border-t border-ink-100">
      <MarketingSection title={t("title")} description={t("description")} />

      <div className="elevate-marketing-shell pb-12 sm:pb-16">
        <div className="mx-auto w-full max-w-[min(60rem,100%)]">
          {posts.length === 0 ? (
            <p className="text-[length:var(--elevate-prose-body-size)] text-ink-700">
              {t("empty")}
            </p>
          ) : (
            <ul className="grid gap-px overflow-hidden border border-ink-100 bg-ink-100">
              {posts.map((post) => (
                <li key={post.slug} className="elevate-cv-list-item bg-paper-100">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="elevate-interactive-subtle block p-5 hover:bg-paper-50 focus-visible:bg-paper-50 sm:p-6"
                  >
                    <time
                      dateTime={post.date}
                      className="font-mono text-[10px] uppercase tabular-nums tracking-[0.08em] text-ink-500"
                    >
                      {t("published", { date: post.date })}
                    </time>
                    <h2 className="mt-2 text-[length:var(--elevate-marketing-list-title-size)] font-semibold leading-snug text-ink-900">
                      {post.title}
                    </h2>
                    {post.description ? (
                      <p className="mt-2 line-clamp-2 text-[length:var(--elevate-prose-body-size)] leading-[var(--elevate-prose-body-leading)] text-ink-700">
                        {post.description}
                      </p>
                    ) : null}
                    <span className="mt-3 inline-block text-sm font-medium text-vermilion-600">
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
