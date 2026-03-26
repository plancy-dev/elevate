import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { MarketingSection } from "@/components/marketing/marketing-section";

const LINKS = [
  { key: "product" as const, href: "/product" },
  { key: "security" as const, href: "/security" },
  { key: "pricing" as const, href: "/pricing" },
  { key: "cases" as const, href: "/case-studies" },
];

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const tMeta = await getTranslations({ locale, namespace: "Metadata" });
  return { title: tMeta("pageTitles.resources") };
}

export default async function ResourcesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ResourcesPage");

  return (
    <div className="border-t border-border-subtle">
      <MarketingSection title={t("title")} description={t("description")}>
        <ul className="grid gap-px bg-border-subtle border border-border-subtle">
          {LINKS.map(({ key, href }) => (
            <li key={key} className="bg-layer-01">
              <Link
                href={href}
                className="block p-5 hover:bg-layer-02 transition-colors"
              >
                <div className="text-sm font-medium text-text-primary">
                  {t(`items.${key}.title`)}
                </div>
                <div className="text-xs text-text-tertiary mt-1">
                  {t(`items.${key}.desc`)}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </MarketingSection>
    </div>
  );
}
