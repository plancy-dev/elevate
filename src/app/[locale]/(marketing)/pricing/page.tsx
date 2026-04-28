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
    return (
      <span className="text-[length:var(--elevate-prose-body-size)] text-ink-900">
        {value}
      </span>
    );
  }
  return value ? (
    <Check className="h-4 w-4 text-vermilion-600" />
  ) : (
    <Minus className="h-4 w-4 text-ink-500" />
  );
}

export default async function PricingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Pricing");
  const plans = t.raw("plans") as Plan[];
  const featureRows = t.raw("featureRows") as FeatureRow[];

  return (
    <div className="border-t border-ink-100">
      <section className="elevate-marketing-shell py-14 text-center sm:py-16">
        <h1 className="text-[length:var(--elevate-marketing-home-hero-size)] font-semibold leading-[1.1] tracking-[-0.02em] text-ink-900">
          {t("heroTitle")}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[length:var(--elevate-marketing-lead-size)] leading-[var(--elevate-prose-body-leading)] text-ink-700">
          {t("heroSub")}
        </p>
      </section>

      <section className="elevate-marketing-shell pb-14 sm:pb-16">
        <div className="grid gap-px overflow-hidden border border-ink-100 bg-ink-100 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.key}
              className={`flex flex-col border-t-2 p-8 ${plan.highlight ? "border-t-vermilion-600 bg-vermilion-50" : "border-t-transparent bg-paper-100"}`}
            >
              <span className="mb-4 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
                {plan.highlight ? t("mostPopular") : plan.name}
              </span>
              <h2 className="text-[length:var(--elevate-marketing-lead-size)] font-semibold text-ink-900">
                {plan.name}
              </h2>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight text-ink-900">
                  {plan.price}
                </span>
                {plan.period && (
                  <span className="text-sm text-ink-500">
                    {plan.period}
                  </span>
                )}
              </div>
              <p className="mt-3 flex-1 text-[length:var(--elevate-prose-body-size)] leading-[var(--elevate-prose-body-leading)] text-ink-500">
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

      <section className="elevate-marketing-shell pb-16 sm:pb-20">
        <h2 className="mb-8 text-center text-[length:var(--elevate-marketing-section-title-size)] font-semibold tracking-[-0.02em] text-ink-900">
          {t("compareTitle")}
        </h2>

        <div className="overflow-x-auto border border-ink-100 bg-paper-100">
          <div className="sticky top-0 z-10 grid grid-cols-[1fr_140px_140px_140px] gap-0 border-b border-ink-100 bg-paper-50">
            <div className="px-5 py-3 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
              {t("featureColumn")}
            </div>
            {plans.map((plan) => (
              <div
                key={plan.key}
                className={`border-l border-ink-100 px-5 py-3 text-center font-mono text-[10px] uppercase tracking-[0.08em] ${plan.highlight ? "bg-vermilion-50 text-vermilion-600" : "text-ink-500"}`}
              >
                {plan.name}
              </div>
            ))}
          </div>

          {featureRows.map((row, i) => (
            <div
              key={row.label}
              className={`elevate-interactive-subtle grid grid-cols-[1fr_140px_140px_140px] gap-0 hover:bg-paper-50 focus-within:bg-paper-50 ${i < featureRows.length - 1 ? "border-b border-ink-100" : ""}`}
            >
              <div className="px-5 py-3 text-[length:var(--elevate-prose-body-size)] text-ink-700">
                {row.label}
              </div>
              {(["starter", "professional", "enterprise"] as const).map(
                (col) => (
                  <div
                    key={col}
                    className={`flex items-center justify-center border-l border-ink-100 px-5 py-3 ${col === "professional" ? "bg-vermilion-50/50" : ""}`}
                  >
                    <FeatureCell value={row[col]} />
                  </div>
                ),
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-ink-100 bg-paper-100">
        <div className="elevate-marketing-shell py-14 text-center sm:py-16">
          <h2 className="text-[length:var(--elevate-marketing-section-title-size)] font-semibold tracking-[-0.02em] text-ink-900">
            {t("faqTitle")}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-[length:var(--elevate-prose-body-size)] leading-[var(--elevate-prose-body-leading)] text-ink-500">
            {t("faqSub")}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <NextLink href="/signup">
              <Button variant="primary" size="lg">
                {t("faqSignUp")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </NextLink>
            <Link href="/contact">
              <Button variant="tertiary" size="lg">
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
