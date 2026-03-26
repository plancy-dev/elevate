import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { MarketingSection } from "@/components/marketing/marketing-section";

const SLUGS = [
  "conferences",
  "exhibitions",
  "incentive-travel",
  "corporate-meetings",
] as const;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const tMeta = await getTranslations({ locale, namespace: "Metadata" });
  return { title: tMeta("pageTitles.solutions") };
}

export default async function SolutionsIndexPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Solutions");

  return (
    <div className="border-t border-border-subtle">
      <MarketingSection title={t("title")} description={t("description")}>
        <ul className="grid gap-px bg-border-subtle border border-border-subtle md:grid-cols-2">
          {SLUGS.map((slug) => (
            <li key={slug} className="bg-layer-01">
              <Link
                href={`/solutions/${slug}`}
                className="block p-6 text-sm font-medium text-text-primary hover:bg-layer-02 transition-colors"
              >
                {t(`items.${slug}`)}
              </Link>
            </li>
          ))}
        </ul>
      </MarketingSection>
    </div>
  );
}
