import Link from "next/link";
import { Check, ArrowRight, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Pricing" };

interface PlanFeature {
  name: string;
  starter: boolean | string;
  professional: boolean | string;
  enterprise: boolean | string;
}

const features: PlanFeature[] = [
  { name: "Events per year", starter: "Up to 10", professional: "Up to 50", enterprise: "Unlimited" },
  { name: "Attendees per event", starter: "500", professional: "5,000", enterprise: "Unlimited" },
  { name: "Team members", starter: "3", professional: "15", enterprise: "Unlimited" },
  { name: "Event dashboard", starter: true, professional: true, enterprise: true },
  { name: "Attendee management", starter: true, professional: true, enterprise: true },
  { name: "Session scheduling", starter: true, professional: true, enterprise: true },
  { name: "Check-in system", starter: true, professional: true, enterprise: true },
  { name: "CSV/Excel import", starter: true, professional: true, enterprise: true },
  { name: "Real-time analytics", starter: false, professional: true, enterprise: true },
  { name: "Custom branding", starter: false, professional: true, enterprise: true },
  { name: "AI-powered insights", starter: false, professional: true, enterprise: true },
  { name: "NPS surveys", starter: false, professional: true, enterprise: true },
  { name: "API access", starter: false, professional: true, enterprise: true },
  { name: "SSO (SAML/OIDC)", starter: false, professional: false, enterprise: true },
  { name: "Audit logging", starter: false, professional: false, enterprise: true },
  { name: "Custom integrations", starter: false, professional: false, enterprise: true },
  { name: "Dedicated account manager", starter: false, professional: false, enterprise: true },
  { name: "SLA guarantee (99.9%)", starter: false, professional: false, enterprise: true },
  { name: "On-premise deployment", starter: false, professional: false, enterprise: true },
  { name: "Support", starter: "Email", professional: "Priority", enterprise: "24/7 dedicated" },
];

const plans = [
  {
    name: "Starter",
    price: "$299",
    period: "/month",
    description: "For small teams getting started with professional event management.",
    cta: "Start Free Trial",
    ctaVariant: "tertiary" as const,
    highlight: false,
    key: "starter" as const,
  },
  {
    name: "Professional",
    price: "$899",
    period: "/month",
    description: "For growing organizations managing multiple events with advanced analytics.",
    cta: "Start Free Trial",
    ctaVariant: "primary" as const,
    highlight: true,
    key: "professional" as const,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large organizations needing maximum security, compliance, and scale.",
    cta: "Contact Sales",
    ctaVariant: "tertiary" as const,
    highlight: false,
    key: "enterprise" as const,
  },
];

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

export default function PricingPage() {
  return (
    <div className="border-t border-border-subtle">
      {/* Hero */}
      <section className="mx-auto max-w-[1584px] px-4 py-16 lg:px-8 text-center">
        <h1 className="text-4xl font-semibold tracking-[-0.02em] text-text-primary lg:text-5xl">
          Simple, transparent pricing
        </h1>
        <p className="mt-4 text-base text-text-secondary max-w-xl mx-auto">
          Start with a 14-day free trial. No credit card required.
          Scale as your events grow.
        </p>
      </section>

      {/* Plan Cards */}
      <section className="mx-auto max-w-[1584px] px-4 lg:px-8 pb-16">
        <div className="grid md:grid-cols-3 gap-px bg-border-subtle border border-border-subtle">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`flex flex-col p-8 ${plan.highlight ? "bg-highlight" : "bg-layer-01"}`}
            >
              {plan.highlight && (
                <span className="text-xs font-medium text-primary mb-4 uppercase tracking-wider">
                  Most Popular
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
                <Link href={plan.name === "Enterprise" ? "/contact" : "/signup"}>
                  <Button
                    variant={plan.ctaVariant}
                    size="lg"
                    className="w-full"
                  >
                    {plan.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="mx-auto max-w-[1584px] px-4 pb-20 lg:px-8">
        <h2 className="text-2xl font-semibold tracking-[-0.02em] text-text-primary mb-8 text-center">
          Compare plans
        </h2>

        <div className="border border-border-subtle bg-layer-01 overflow-x-auto">
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_140px_140px_140px] gap-0 border-b border-border-subtle sticky top-0 bg-layer-01 z-10">
            <div className="px-5 py-3 text-xs font-medium text-text-tertiary uppercase tracking-wider">
              Feature
            </div>
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`px-5 py-3 text-xs font-medium text-center uppercase tracking-wider border-l border-border-subtle ${plan.highlight ? "text-primary bg-highlight" : "text-text-tertiary"}`}
              >
                {plan.name}
              </div>
            ))}
          </div>

          {/* Rows */}
          {features.map((feature, i) => (
            <div
              key={feature.name}
              className={`grid grid-cols-[1fr_140px_140px_140px] gap-0 ${i < features.length - 1 ? "border-b border-border-subtle" : ""} hover:bg-layer-02 transition-colors`}
            >
              <div className="px-5 py-3 text-sm text-text-secondary">
                {feature.name}
              </div>
              {(["starter", "professional", "enterprise"] as const).map(
                (key) => (
                  <div
                    key={key}
                    className={`px-5 py-3 flex items-center justify-center border-l border-border-subtle ${key === "professional" ? "bg-highlight/50" : ""}`}
                  >
                    <FeatureCell value={feature[key]} />
                  </div>
                ),
              )}
            </div>
          ))}
        </div>
      </section>

      {/* FAQ CTA */}
      <section className="border-t border-border-subtle bg-layer-01">
        <div className="mx-auto max-w-[1584px] px-4 py-16 lg:px-8 text-center">
          <h2 className="text-2xl font-semibold text-text-primary">
            Have questions?
          </h2>
          <p className="mt-2 text-sm text-text-tertiary max-w-md mx-auto">
            Our team is happy to help you find the right plan for your
            organization. Schedule a call to discuss your needs.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/contact">
              <Button variant="primary" size="lg">
                Talk to Sales
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
