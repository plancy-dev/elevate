import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import {
  ArrowRight,
  BarChart3,
  Brain,
  FileDiff,
  Globe,
  Shield,
  Workflow,
  CheckCircle2,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
  MarketingTrackedLocaleLink,
  MarketingTrackedNextLink,
} from "@/components/analytics/marketing-tracked-links";
import { MarketingCtaId } from "@/lib/analytics/posthog-events";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KPIDashboardPreview } from "@/components/marketing/kpi-dashboard-preview";
import { PretextHeroStatement } from "@/components/marketing/pretext-hero-statement";
import { WaitlistForm } from "@/components/marketing/waitlist-form";
type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return {
    title: t("homeTitle"),
    description: t("homeDescription"),
    openGraph: {
      title: t("homeTitle"),
      description: t("homeDescription"),
      locale: locale.replace("-", "_"),
    },
  };
}

export default async function Home({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Home");

  const capabilities = [
    {
      icon: <Workflow className="h-5 w-5" />,
      title: t("capOrchestrationTitle"),
      description: t("capOrchestrationDesc"),
    },
    {
      icon: <Brain className="h-5 w-5" />,
      title: t("capAiTitle"),
      description: t("capAiDesc"),
    },
    {
      icon: <FileDiff className="h-5 w-5" />,
      title: t("capReviewTitle"),
      description: t("capReviewDesc"),
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      title: t("capAnalyticsTitle"),
      description: t("capAnalyticsDesc"),
    },
    {
      icon: <Globe className="h-5 w-5" />,
      title: t("capGlobalTitle"),
      description: t("capGlobalDesc"),
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: t("capSecurityTitle"),
      description: t("capSecurityDesc"),
    },
  ];

  const pillars = [
    { title: t("pillar1Title"), sub: t("pillar1Sub") },
    { title: t("pillar2Title"), sub: t("pillar2Sub") },
    { title: t("pillar3Title"), sub: t("pillar3Sub") },
    { title: t("pillar4Title"), sub: t("pillar4Sub") },
  ];

  const ctaChecks = [t("ctaCheck1"), t("ctaCheck2"), t("ctaCheck3")];

  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden border-b border-border-subtle">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(15,98,254,0.08),transparent_60%)]" />

        <div className="relative mx-auto max-w-[1584px] px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 py-16 lg:py-24">
            <div className="flex flex-col justify-center">
              <Badge variant="blue" className="w-fit mb-6">
                {t("badge")}
              </Badge>

              <h1 className="text-4xl font-semibold tracking-[-0.02em] leading-[1.15] lg:text-[56px] text-text-primary">
                {t("headline")}
                <br />
                <span className="text-text-tertiary">{t("headlineAccent")}</span>
              </h1>

              <p className="mt-6 text-base text-text-secondary leading-relaxed max-w-lg">
                {t("subhead")}
              </p>

              <PretextHeroStatement
                line1={t("pretextLine1")}
                line2={t("pretextLine2")}
                sub={t("pretextSub")}
              />

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <MarketingTrackedLocaleLink
                  href="/#waitlist"
                  ctaId={MarketingCtaId.HERO_WAITLIST_ANCHOR}
                >
                  <Button variant="primary" size="lg">
                    {t("ctaWaitlist")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </MarketingTrackedLocaleLink>
                <MarketingTrackedLocaleLink
                  href="/product/prompt-studio"
                  ctaId={MarketingCtaId.HERO_PROMPT_STUDIO}
                >
                  <Button variant="tertiary" size="lg">
                    {t("ctaPromptStudio")}
                  </Button>
                </MarketingTrackedLocaleLink>
                <MarketingTrackedLocaleLink
                  href="/product/ebooks-and-guides"
                  ctaId={MarketingCtaId.HERO_EBOOKS}
                >
                  <Button variant="tertiary" size="lg">
                    {t("ctaEbooks")}
                  </Button>
                </MarketingTrackedLocaleLink>
              </div>
              <p className="mt-4 text-sm text-text-tertiary">
                {t("ctaSignUpHint")}{" "}
                <MarketingTrackedNextLink
                  href="/signup"
                  ctaId={MarketingCtaId.HERO_SIGNUP}
                  className="text-interactive hover:text-primary transition-colors font-medium"
                >
                  {t("ctaSignUp")}
                </MarketingTrackedNextLink>
              </p>
            </div>

            <div className="relative flex items-center">
              <div className="w-full">
                <KPIDashboardPreview />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border-subtle bg-layer-01">
        <div className="mx-auto max-w-[1584px] px-4 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4">
            {pillars.map((p, i) => (
              <div
                key={p.title}
                className={`py-8 px-6 ${i < 3 ? "border-r border-border-subtle" : ""}`}
              >
                <div className="text-sm font-medium text-text-primary leading-snug">
                  {p.title}
                </div>
                <div className="mt-2 text-xs text-text-tertiary leading-relaxed">
                  {p.sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border-subtle">
        <div className="mx-auto max-w-[1584px] px-4 py-20 lg:px-8">
          <div className="max-w-2xl mb-12">
            <h2 className="text-3xl font-semibold tracking-[-0.02em] text-text-primary">
              {t("sectionCapabilitiesTitle")}
            </h2>
            <p className="mt-3 text-base text-text-secondary leading-relaxed">
              {t("sectionCapabilitiesSub")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-border-subtle border border-border-subtle">
            {capabilities.map((cap) => (
              <Card
                key={cap.title}
                className="border-0 bg-layer-01 hover:bg-layer-02 transition-colors duration-150"
              >
                <CardContent className="p-6">
                  <div className="flex h-10 w-10 items-center justify-center bg-highlight text-primary mb-4">
                    {cap.icon}
                  </div>
                  <h3 className="text-base font-semibold text-text-primary mb-2">
                    {cap.title}
                  </h3>
                  <p className="text-sm text-text-tertiary leading-relaxed">
                    {cap.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section
        id="waitlist"
        className="border-b border-border-subtle bg-layer-01 scroll-mt-20"
      >
        <div className="mx-auto max-w-[1584px] px-4 py-16 lg:px-8">
          <div className="max-w-xl">
            <h2 className="text-2xl font-semibold tracking-[-0.02em] text-text-primary">
              {t("sectionWaitlistTitle")}
            </h2>
            <p className="mt-3 text-sm text-text-secondary leading-relaxed">
              {t("sectionWaitlistSub")}
            </p>
            <WaitlistForm source="home" className="mt-8" />
          </div>
        </div>
      </section>

      <section className="border-b border-border-subtle bg-layer-01">
        <div className="mx-auto max-w-[1584px] px-4 py-20 lg:px-8">
          <div className="max-w-xl">
            <Badge variant="green" className="mb-4">
              {t("resourcesBadge")}
            </Badge>
            <h2 className="text-2xl font-semibold tracking-[-0.02em] text-text-primary">
              {t("resourcesTitle")}
            </h2>
            <p className="mt-3 text-sm text-text-tertiary leading-relaxed">
              {t("resourcesBody")}
            </p>
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 mt-6 text-sm text-interactive hover:text-primary transition-colors"
            >
              {t("resourcesCta")}
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-primary">
        <div className="mx-auto max-w-[1584px] px-4 py-16 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold text-white tracking-[-0.02em]">
              {t("ctaBandTitle")}
            </h2>
            <p className="mt-2 text-base text-white/70">
              {t("ctaBandSub")}
            </p>
            <WaitlistForm
              source="band"
              variant="panel"
              className="mt-8 max-w-xl"
            />
          </div>

          <div className="mt-10 flex flex-col sm:flex-row flex-wrap gap-3">
            <MarketingTrackedLocaleLink
              href="/product/ebooks-and-guides"
              ctaId={MarketingCtaId.BAND_EBOOKS}
            >
              <Button
                variant="ghost"
                size="lg"
                className="text-white/90 hover:text-white hover:bg-white/10 border border-white/30"
              >
                {t("ctaBandEbooks")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </MarketingTrackedLocaleLink>
            <MarketingTrackedNextLink
              href="/signup"
              ctaId={MarketingCtaId.BAND_SIGNUP}
            >
              <Button
                variant="ghost"
                size="lg"
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                {t("ctaBandSignUp")}
              </Button>
            </MarketingTrackedNextLink>
            <MarketingTrackedLocaleLink
              href="/contact"
              ctaId={MarketingCtaId.BAND_CONTACT}
            >
              <Button
                variant="ghost"
                size="lg"
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                {t("ctaBandContact")}
              </Button>
            </MarketingTrackedLocaleLink>
          </div>

          <div className="mt-10 pt-8 border-t border-white/10">
            <div className="flex flex-wrap gap-x-8 gap-y-3">
              {ctaChecks.map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-white/60" />
                  <span className="text-sm text-white/70">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
