import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { MarketingSection } from "@/components/marketing/marketing-section";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const tMeta = await getTranslations({ locale, namespace: "Metadata" });
  return { title: tMeta("pageTitles.contact") };
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Contact");

  return (
    <div className="border-t border-border-subtle">
      <MarketingSection title={t("title")} description={t("description")}>
        <form className="max-w-md space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              {t("labelEmail")}
            </label>
            <input
              type="email"
              className="h-10 w-full bg-field border border-border-subtle px-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-focus"
              placeholder={t("placeholderEmail")}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              {t("labelCompany")}
            </label>
            <input
              type="text"
              className="h-10 w-full bg-field border border-border-subtle px-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-focus"
              placeholder={t("placeholderCompany")}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              {t("labelMessage")}
            </label>
            <textarea
              rows={4}
              className="w-full bg-field border border-border-subtle px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-focus"
              placeholder={t("placeholderMessage")}
            />
          </div>
          <Button variant="primary" size="lg" type="submit">
            {t("submit")}
          </Button>
        </form>
      </MarketingSection>
    </div>
  );
}
