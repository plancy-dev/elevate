import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { MarketingSection } from "@/components/marketing/marketing-section";

const VALID_SLUGS = new Set([
  "event-management",
  "attendee-engagement",
  "analytics",
  "ai-concierge",
]);

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const tMeta = await getTranslations({ locale, namespace: "Metadata" });
  if (!VALID_SLUGS.has(slug)) {
    return { title: tMeta("pageTitles.product") };
  }
  const t = await getTranslations({ locale, namespace: "ProductSlug" });
  return { title: t(`${slug}.metaTitle`) };
}

export default async function ProductModulePage({ params }: Props) {
  const { locale, slug } = await params;
  if (!VALID_SLUGS.has(slug)) notFound();

  setRequestLocale(locale);
  const t = await getTranslations("ProductSlug");

  return (
    <div className="border-t border-border-subtle">
      <MarketingSection
        title={t(`${slug}.title`)}
        description={t(`${slug}.body`)}
      />
    </div>
  );
}
