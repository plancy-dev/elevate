import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { MarketingSection } from "@/components/marketing/marketing-section";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return { title: t("termsTitle") };
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Terms");

  const paragraphs = [
    t("p1"),
    t("p2"),
    t("p3"),
    t("p4"),
    t("p5"),
    t("p6"),
    t("p7"),
    t("p8"),
  ];

  return (
    <div className="border-t border-border-subtle">
      <MarketingSection title={t("title")} description={t("updated")}>
        <div className="max-w-3xl space-y-5 text-sm text-text-secondary leading-relaxed">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </MarketingSection>
    </div>
  );
}
