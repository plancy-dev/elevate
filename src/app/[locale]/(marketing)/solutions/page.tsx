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
    <div className="border-t border-ink-100">
      <MarketingSection title={t("title")} description={t("description")}>
        <ul className="grid gap-px overflow-hidden border border-ink-100 bg-ink-100 md:grid-cols-2">
          {SLUGS.map((slug) => (
            <li key={slug} className="bg-paper-100">
              <Link
                href={`/solutions/${slug}`}
                className="elevate-interactive-subtle block p-5 hover:bg-paper-50 focus-visible:bg-paper-50 sm:p-6"
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
                  {slug.replaceAll("-", " ")}
                </p>
                <span className="text-[length:var(--elevate-marketing-lead-size)] font-semibold leading-snug text-ink-900">
                  {t(`items.${slug}.title`)}
                </span>
                <p className="mt-2 text-[length:var(--elevate-prose-body-size)] leading-[var(--elevate-prose-body-leading)] text-ink-500">
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
