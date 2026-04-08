import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { MarketingArticle } from "@/components/marketing/marketing-article";

const VALID_SLUGS = new Set([
  "prompt-studio",
  "ebooks-and-guides",
  "org-workspace",
  "security",
]);

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const tMeta = await getTranslations({ locale, namespace: "Metadata" });
  if (!VALID_SLUGS.has(slug)) {
    return { title: tMeta("pageTitles.product") };
  }
  const t = await getTranslations({ locale, namespace: "ProductSlug" });
  const title = t(`${slug}.metaTitle`);
  const description = t(`${slug}.metaDescription`);
  return {
    title,
    description,
    openGraph: { title, description, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ProductModulePage({ params }: Props) {
  const { locale, slug } = await params;
  if (!VALID_SLUGS.has(slug)) notFound();

  setRequestLocale(locale);
  const t = await getTranslations("ProductSlug");

  const sections = [
    { title: t(`${slug}.section1Title`), body: t(`${slug}.section1Body`) },
    { title: t(`${slug}.section2Title`), body: t(`${slug}.section2Body`) },
    { title: t(`${slug}.section3Title`), body: t(`${slug}.section3Body`) },
  ];

  return (
    <div className="border-t border-marketing-border-subtle">
      <MarketingArticle
        title={t(`${slug}.title`)}
        lead={t(`${slug}.lead`)}
        sections={sections}
      />
    </div>
  );
}
