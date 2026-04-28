import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { MarketingSection } from "@/components/marketing/marketing-section";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const tMeta = await getTranslations({ locale, namespace: "Metadata" });
  return { title: tMeta("pageTitles.caseStudies") };
}

export default async function CaseStudiesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("CaseStudies");

  return (
    <div className="border-t border-ink-100">
      <MarketingSection title={t("title")} description={t("description")}>
        <div className="border border-ink-100 bg-paper-100 p-8 text-sm text-ink-700">
          {t("body")}
        </div>
      </MarketingSection>
    </div>
  );
}
