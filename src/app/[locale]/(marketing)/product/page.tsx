import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { MarketingSection } from "@/components/marketing/marketing-section";

const SLUGS = [
  "prompt-studio",
  "ebooks-and-guides",
  "org-workspace",
  "security",
] as const;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const tMeta = await getTranslations({ locale, namespace: "Metadata" });
  return { title: tMeta("pageTitles.product") };
}

export default async function ProductPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Product");

  return (
    <div className="border-t border-marketing-border-subtle">
      <MarketingSection title={t("title")} description={t("description")}>
        <div className="grid gap-px overflow-hidden rounded-xl border border-marketing-border-subtle bg-marketing-border-subtle md:grid-cols-2">
          {SLUGS.map((slug) => (
            <Link
              key={slug}
              href={`/product/${slug}`}
              className="bg-layer-01 p-5 transition-colors duration-150 hover:bg-layer-02 sm:p-6"
            >
              <h2 className="text-[length:var(--elevate-marketing-lead-size)] font-semibold leading-snug text-text-primary">
                {t(`modules.${slug}.title`)}
              </h2>
              <p className="mt-2 text-[length:var(--elevate-prose-body-size)] leading-[var(--elevate-prose-body-leading)] text-text-tertiary">
                {t(`modules.${slug}.desc`)}
              </p>
            </Link>
          ))}
        </div>
      </MarketingSection>
    </div>
  );
}
