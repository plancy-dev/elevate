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
    <div className="border-t border-marketing-border-subtle">
      <MarketingSection title={t("title")} description={t("description")}>
        <ul className="grid gap-px overflow-hidden rounded-xl border border-marketing-border-subtle bg-marketing-border-subtle md:grid-cols-2">
          {SLUGS.map((slug) => (
            <li key={slug} className="bg-layer-01">
              <Link
                href={`/solutions/${slug}`}
                className="block p-5 transition-colors duration-150 hover:bg-layer-02 sm:p-6"
              >
                <span className="text-[length:var(--elevate-marketing-lead-size)] font-semibold leading-snug text-text-primary">
                  {t(`items.${slug}.title`)}
                </span>
                <p className="mt-2 text-[length:var(--elevate-prose-body-size)] leading-[var(--elevate-prose-body-leading)] text-text-tertiary">
                  {t(`items.${slug}.desc`)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </MarketingSection>
    </div>
  );
}
