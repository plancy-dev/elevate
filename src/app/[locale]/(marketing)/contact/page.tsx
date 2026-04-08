import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
    <div className="border-t border-marketing-border-subtle">
      <MarketingSection title={t("title")} description={t("description")}>
        <form className="max-w-md space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              {t("labelEmail")}
            </label>
            <Input
              type="email"
              placeholder={t("placeholderEmail")}
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              {t("labelCompany")}
            </label>
            <Input type="text" placeholder={t("placeholderCompany")} />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              {t("labelMessage")}
            </label>
            <Textarea placeholder={t("placeholderMessage")} rows={4} />
          </div>
          <Button variant="primary" size="lg" type="submit">
            {t("submit")}
          </Button>
        </form>
      </MarketingSection>
    </div>
  );
}
