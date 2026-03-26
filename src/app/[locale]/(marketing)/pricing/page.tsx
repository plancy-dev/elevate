import NextLink from "next/link";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Check, ArrowRight, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";

type Plan = {
  key: "starter" | "professional" | "enterprise";
  name: string;
  price: string;
  period: string;
  description: string;
  cta: string;
  highlight: boolean;
};

type FeatureRow =
  | {
      kind: "text";
      label: string;
      starter: string;
      professional: string;
      enterprise: string;
    }
  | {
      kind: "check";
      label: string;
      starter: boolean;
      professional: boolean;
      enterprise: boolean;
    };

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const tMeta = await getTranslations({ locale, namespace: "Metadata" });
  return { title: tMeta("pageTitles.pricing") };
}

function FeatureCell({ value }: { value: boolean | string }) {
  if (typeof value === "string") {
    return <span className="text-sm text-text-primary">{value}</span>;
  }
  return value ? (
    <Check className="h-4 w-4 text-accent" />
  ) : (
    <Minus className="h-4 w-4 text-text-tertiary" />
  );
}

export default async function PricingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Pricing");
  const plans = t.raw("plans") as Plan[];
  const featureRows = t.raw("featureRows") as FeatureRow[];

  return (
    <div className="border-t border-border-subtle">
      <section className="mx-auto max-w-[1584px] px-4 py-16 lg:px-8 text-center">
        <h1 className="text-4xl font-semibold tracking-[-0.02em] text-text-primary lg:text-5xl">
          {t("heroTitle")}
        </h1>
        <p className="mt-4 text-base text-text-secondary max-w-xl mx-auto">
          {t("heroSub")}
        </p>
      </section>

      <section className="mx-auto max-w-[1584px] px-4 lg:px-8 pb-16">
        <div className="grid md:grid-cols-3 gap-px bg-border-subtle border border-border-subtle">
          {plans.map((plan) => (
            <div
              key={plan.key}
              className={`flex flex-col p-8 ${plan.highlight ? "bg-highlight" : "bg-layer-01"}`}
            >
              {plan.highlight && (
                <span className="text-xs font-medium text-primary mb-4 uppercase tracking-wider">
                  {t("mostPopular")}
                </span>
              )}
              <h2 className="text-lg font-semibold text-text-primary">
                {plan.name}
              </h2>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight text-text-primary">
                  {plan.price}
                </span>
                {plan.period && (
                  <span className="text-sm text-text-tertiary">
                    {plan.period}
                  </span>
                )}
              </div>
              <p className="mt-3 text-sm text-text-tertiary leading-relaxed flex-1">
                {plan.description}
              </p>
              <div className="mt-6">
                {plan.key === "enterprise" ? (
                  <Link href="/contact">
                    <Button
                      variant="tertiary"
                      size="lg"
                      className="w-full"
                    >
                      {plan.cta}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                ) : (
                  <NextLink href="/signup">
                    <Button
                      variant={plan.highlight ? "primary" : "tertiary"}
                      size="lg"
                      className="w-full"
                    >
                      {plan.cta}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </NextLink>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1584px] px-4 pb-20 lg:px-8">
        <h2 className="text-2xl font-semibold tracking-[-0.02em] text-text-primary mb-8 text-center">
          {t("compareTitle")}
        </h2>

        <div className="border border-border-subtle bg-layer-01 overflow-x-auto">
          <div className="grid grid-cols-[1fr_140px_140px_140px] gap-0 border-b border-border-subtle sticky top-0 bg-layer-01 z-10">
            <div className="px-5 py-3 text-xs font-medium text-text-tertiary uppercase tracking-wider">
              {t("featureColumn")}
            </div>
            {plans.map((plan) => (
              <div
                key={plan.key}
                className={`px-5 py-3 text-xs font-medium text-center uppercase tracking-wider border-l border-border-subtle ${plan.highlight ? "text-primary bg-highlight" : "text-text-tertiary"}`}
              >
                {plan.name}
              </div>
            ))}
          </div>

          {featureRows.map((row, i) => (
            <div
              key={row.label}
              className={`grid grid-cols-[1fr_140px_140px_140px] gap-0 ${i < featureRows.length - 1 ? "border-b border-border-subtle" : ""} hover:bg-layer-02 transition-colors`}
            >
              <div className="px-5 py-3 text-sm text-text-secondary">
                {row.label}
              </div>
              {(["starter", "professional", "enterprise"] as const).map(
                (col) => (
                  <div
                    key={col}
                    className={`px-5 py-3 flex items-center justify-center border-l border-border-subtle ${col === "professional" ? "bg-highlight/50" : ""}`}
                  >
                    <FeatureCell value={row[col]} />
                  </div>
                ),
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border-subtle bg-layer-01">
        <div className="mx-auto max-w-[1584px] px-4 py-16 lg:px-8 text-center">
          <h2 className="text-2xl font-semibold text-text-primary">
            {t("faqTitle")}
          </h2>
          <p className="mt-2 text-sm text-text-tertiary max-w-md mx-auto">
            {t("faqSub")}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/contact">
              <Button variant="primary" size="lg">
                {t("faqCta")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
