import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import {
  ArrowRight,
  BarChart3,
  Brain,
  FileDiff,
  Globe,
  Shield,
  Workflow,
} from "lucide-react";
import { Link, getPathname } from "@/i18n/navigation";
import {
  MarketingTrackedLocaleLink,
  MarketingTrackedNextLink,
} from "@/components/analytics/marketing-tracked-links";
import { MarketingCtaId } from "@/lib/analytics/posthog-events";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buildPathAlternatesLanguages } from "@/lib/seo/locale-alternates";
import { getSiteUrl } from "@/lib/seo/site-url";
import { KPIDashboardPreview } from "@/components/marketing/kpi-dashboard-preview";
import { PretextHeroStatement } from "@/components/marketing/pretext-hero-statement";
import { WaitlistForm } from "@/components/marketing/waitlist-form";
type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  const pathname = getPathname({ locale, href: "/" as never });
  const canonicalUrl = `${getSiteUrl()}${pathname}`;
  return {
    title: t("homeTitle"),
    description: t("homeDescription"),
    alternates: {
      canonical: canonicalUrl,
      languages: buildPathAlternatesLanguages("/"),
    },
    openGraph: {
      title: t("homeTitle"),
      description: t("homeDescription"),
      url: canonicalUrl,
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

  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden border-b border-marketing-border-subtle">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--marketing-glow),transparent_58%)]" />

        <div className="relative elevate-marketing-shell">
          <div className="grid gap-10 py-14 sm:gap-12 sm:py-16 lg:grid-cols-2 lg:gap-16 lg:py-24">
            <div className="flex flex-col justify-center">
              <Badge variant="blue" className="mb-6 w-fit">
                {t("badge")}
              </Badge>

              <h1 className="text-[length:var(--elevate-marketing-home-hero-size)] font-semibold tracking-[-0.02em] leading-[1.12] text-text-primary">
                {t("headline")}
                <br />
                <span className="text-text-tertiary">{t("headlineAccent")}</span>
              </h1>

              <p className="mt-6 max-w-lg text-[length:var(--elevate-marketing-lead-size)] leading-[var(--elevate-prose-body-leading)] text-text-secondary">
                {t("subhead")}
              </p>

              <PretextHeroStatement
                variant="marketing"
                line1={t("pretextLine1")}
                line2={t("pretextLine2")}
                sub={t("pretextSub")}
              />

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <MarketingTrackedLocaleLink
                  href="/#waitlist"
                  ctaId={MarketingCtaId.HERO_WAITLIST_ANCHOR}
                >
                  <Button variant="marketing" size="lg" className="px-6">
                    {t("ctaWaitlist")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </MarketingTrackedLocaleLink>
                <MarketingTrackedLocaleLink
                  href="/product/prompt-studio"
                  ctaId={MarketingCtaId.HERO_PROMPT_STUDIO}
                >
                  <Button variant="tertiary" size="lg" className="rounded-full">
                    {t("ctaPromptStudio")}
                  </Button>
                </MarketingTrackedLocaleLink>
                <MarketingTrackedLocaleLink
                  href="/product/ebooks-and-guides"
                  ctaId={MarketingCtaId.HERO_EBOOKS}
                >
                  <Button variant="tertiary" size="lg" className="rounded-full">
                    {t("ctaEbooks")}
                  </Button>
                </MarketingTrackedLocaleLink>
              </div>
              <p className="mt-4 text-[length:var(--elevate-prose-body-size)] leading-[var(--elevate-prose-body-leading)] text-text-tertiary">
                {t("ctaSignUpHint")}{" "}
                <MarketingTrackedNextLink
                  href="/signup"
                  ctaId={MarketingCtaId.HERO_SIGNUP}
                  className="font-medium text-interactive transition-colors hover:text-marketing-accent-hover"
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

      <section className="border-b border-marketing-border-subtle bg-layer-01">
        <div className="elevate-marketing-shell">
          <div className="grid grid-cols-2 lg:grid-cols-4">
            {pillars.map((p, i) => (
              <div
                key={p.title}
                className={`px-4 py-8 sm:px-6 ${i < 3 ? "border-r border-marketing-border-subtle" : ""}`}
              >
                <div className="text-[length:var(--elevate-prose-body-size)] font-medium leading-snug text-text-primary">
                  {p.title}
                </div>
                <div className="mt-2 text-[length:var(--elevate-prose-body-size)] text-text-tertiary leading-[var(--elevate-prose-body-leading)]">
                  {p.sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-marketing-border-subtle">
        <div className="elevate-marketing-shell py-14 sm:py-16 lg:py-20">
          <div className="mb-10 max-w-2xl sm:mb-12">
            <h2 className="text-[length:var(--elevate-marketing-section-title-size)] font-semibold tracking-[-0.02em] text-text-primary">
              {t("sectionCapabilitiesTitle")}
            </h2>
            <p className="mt-3 text-[length:var(--elevate-marketing-lead-size)] leading-[var(--elevate-prose-body-leading)] text-text-secondary">
              {t("sectionCapabilitiesSub")}
            </p>
          </div>

          <div className="grid gap-px border border-marketing-border-subtle bg-marketing-border-subtle md:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((cap) => (
              <Card
                key={cap.title}
                className="border-0 bg-layer-01 shadow-none transition-colors duration-150 hover:bg-layer-02"
              >
                <CardContent className="p-5 sm:p-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center bg-highlight text-primary">
                    {cap.icon}
                  </div>
                  <h3 className="mb-2 text-[length:var(--elevate-marketing-lead-size)] font-semibold text-text-primary">
                    {cap.title}
                  </h3>
                  <p className="text-[length:var(--elevate-prose-body-size)] leading-[var(--elevate-prose-body-leading)] text-text-tertiary">
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
        className="border-b border-marketing-border-subtle bg-layer-01 scroll-mt-20"
      >
        <div className="elevate-marketing-shell py-14 sm:py-16">
          <div className="max-w-xl">
            <h2 className="text-[length:var(--elevate-marketing-section-title-size)] font-semibold tracking-[-0.02em] text-text-primary">
              {t("sectionWaitlistTitle")}
            </h2>
            <p className="mt-3 text-[length:var(--elevate-marketing-lead-size)] leading-[var(--elevate-prose-body-leading)] text-text-secondary">
              {t("sectionWaitlistSub")}
            </p>
            <WaitlistForm source="home" className="mt-8" />
          </div>
        </div>
      </section>

      <section className="border-b border-marketing-border-subtle bg-layer-01">
        <div className="elevate-marketing-shell py-14 sm:py-16 lg:py-20">
          <div className="max-w-xl">
            <Badge variant="green" className="mb-4">
              {t("resourcesBadge")}
            </Badge>
            <h2 className="text-[length:var(--elevate-marketing-section-title-size)] font-semibold tracking-[-0.02em] text-text-primary">
              {t("resourcesTitle")}
            </h2>
            <p className="mt-3 text-[length:var(--elevate-marketing-lead-size)] leading-[var(--elevate-prose-body-leading)] text-text-tertiary">
              {t("resourcesBody")}
            </p>
            <Link
              href="/blog"
              className="mt-6 inline-flex items-center gap-1.5 text-[length:var(--elevate-prose-body-size)] font-medium text-interactive transition-colors hover:text-primary"
            >
              {t("resourcesCta")}
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-primary">
        <div className="elevate-marketing-shell py-14 sm:py-16">
          <div className="max-w-2xl">
            <h2 className="text-[length:var(--elevate-marketing-section-title-size)] font-semibold tracking-[-0.02em] text-white">
              {t("ctaBandTitle")}
            </h2>
            <p className="mt-2 text-[length:var(--elevate-marketing-lead-size)] leading-[var(--elevate-prose-body-leading)] text-white/80">
              {t("ctaBandSub")}
            </p>
            <WaitlistForm
              source="band"
              variant="panel"
              className="mt-8 max-w-xl"
            />
          </div>

          <div className="mt-8 flex flex-col sm:flex-row flex-wrap gap-3">
            <MarketingTrackedLocaleLink
              href="/contact"
              ctaId={MarketingCtaId.BAND_CONTACT}
              className="inline-flex"
            >
              <Button
                variant="ghost"
                size="lg"
                className="w-full sm:w-auto border-0 bg-white px-6 font-semibold text-primary shadow-md transition-shadow hover:bg-zinc-50 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:min-w-[12rem]"
              >
                {t("ctaBandContact")}
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
              </Button>
            </MarketingTrackedLocaleLink>
          </div>
        </div>
      </section>
    </div>
  );
}
