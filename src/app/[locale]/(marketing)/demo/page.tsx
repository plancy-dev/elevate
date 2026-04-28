import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { MarketingSection } from "@/components/marketing/marketing-section";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Demo" });
  return { title: t("pausedMetaTitle") };
}

export default async function DemoPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Demo");

  return (
    <div className="border-t border-ink-100">
      <MarketingSection title={t("pausedTitle")} description={t("pausedDescription")}>
        <p>
          <Link
            href="/"
            className="text-sm font-medium text-vermilion-600 hover:underline"
          >
            {t("pausedBackHome")}
          </Link>
        </p>
      </MarketingSection>
    </div>
  );
}
