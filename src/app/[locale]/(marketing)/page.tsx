import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { cookies } from "next/headers";
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
import {
  HERO_VARIANT_COOKIE,
  HERO_VARIANT_SOURCE_COOKIE,
  parseHeroVariant,
  parseHeroVariantSource,
  type HeroVariant,
  type HeroVariantSource,
} from "@/lib/analytics/hero-variant";
type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ hero_variant?: string | string[] }>;
};

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

export default async function Home({ params, searchParams }: Props) {
  const { locale } = await params;
  const query = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("Home");
  const cookieStore = await cookies();
  const queryHeroVariant = parseHeroVariant(
    Array.isArray(query.hero_variant) ? query.hero_variant[0] : query.hero_variant,
  );
  const cookieHeroVariant = parseHeroVariant(
    cookieStore.get(HERO_VARIANT_COOKIE)?.value,
  );
  const cookieHeroSource = parseHeroVariantSource(
    cookieStore.get(HERO_VARIANT_SOURCE_COOKIE)?.value,
  );
  const heroVariant: HeroVariant = queryHeroVariant ?? cookieHeroVariant ?? "A";
  const heroVariantSource: HeroVariantSource = queryHeroVariant
    ? "query"
    : cookieHeroSource ?? (cookieHeroVariant ? "cookie" : "random");
  const isVariantA = heroVariant === "A";
  const showHeroVariantDebugBadge = process.env.NODE_ENV !== "production";

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
      <section className="relative overflow-hidden border-b border-ink-100">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--marketing-glow),transparent_58%)]" />

        <div className="relative elevate-marketing-shell">
          <div className="grid gap-10 py-14 sm:gap-12 sm:py-16 lg:grid-cols-2 lg:gap-16 lg:py-24">
            <div className="flex flex-col justify-center">
              <div className="mb-6 flex items-center gap-2">
                <Badge variant="blue" className="w-fit">
                  {t("badge")}
                </Badge>
                {showHeroVariantDebugBadge ? (
                  <span className="inline-flex items-center border border-ink-100 bg-paper-100 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
                    {heroVariant} · {heroVariantSource}
                  </span>
                ) : null}
              </div>

              <h1 className="text-[length:var(--elevate-marketing-home-hero-size)] font-semibold tracking-[-0.02em] leading-[1.12] text-ink-900">
                {t("headline")}
                <br />
                <span className="text-ink-500">{t("headlineAccent")}</span>
              </h1>

              <p className="mt-6 max-w-lg text-[length:var(--elevate-marketing-lead-size)] leading-[var(--elevate-prose-body-leading)] text-ink-700">
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
                  eventProperties={{
                    hero_variant: heroVariant,
                    intent: "notify_me",
                  }}
                >
                  <Button variant="marketing" size="lg" className="px-6">
                    {isVariantA ? t("ctaWaitlist") : t("ctaWaitlistB")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </MarketingTrackedLocaleLink>
                <MarketingTrackedLocaleLink
                  href="/product/prompt-studio"
                  ctaId={MarketingCtaId.HERO_PROMPT_STUDIO}
                  eventProperties={{
                    hero_variant: heroVariant,
                    intent: "explore_product",
                  }}
                >
                  <Button variant="tertiary" size="lg">
                    {t("ctaPromptStudio")}
                  </Button>
                </MarketingTrackedLocaleLink>
                <MarketingTrackedLocaleLink
                  href="/product/ebooks-and-guides"
                  ctaId={MarketingCtaId.HERO_EBOOKS}
                  eventProperties={{
                    hero_variant: heroVariant,
                    intent: "explore_resources",
                  }}
                >
                  <Button variant="tertiary" size="lg">
                    {t("ctaEbooks")}
                  </Button>
                </MarketingTrackedLocaleLink>
              </div>
              <p className="mt-4 text-[length:var(--elevate-prose-body-size)] leading-[var(--elevate-prose-body-leading)] text-ink-500">
                {isVariantA ? (
                  <>
                    {t("ctaSignUpHint")}{" "}
                    <MarketingTrackedNextLink
                      href="/signup"
                      ctaId={MarketingCtaId.HERO_SIGNUP}
                      eventProperties={{ hero_variant: heroVariant, intent: "read_now" }}
                      className="font-medium text-vermilion-600 transition-colors duration-80 ease-(--ease-editorial) hover:text-vermilion-700"
                    >
                      {t("ctaSignUp")}
                    </MarketingTrackedNextLink>
                    <span aria-hidden className="mx-2 text-ink-300">
                      ·
                    </span>
                    <MarketingTrackedLocaleLink
                      href="/#waitlist"
                      ctaId={MarketingCtaId.HERO_WAITLIST_INLINE_NOTIFY}
                      eventProperties={{ hero_variant: heroVariant, intent: "notify_me" }}
                      className="font-medium text-vermilion-600 transition-colors duration-80 ease-(--ease-editorial) hover:text-vermilion-700"
                    >
                      {t("ctaWaitlistNotify")}
                    </MarketingTrackedLocaleLink>
                  </>
                ) : (
                  <>
                    {t("ctaSignUpHintB")}{" "}
                    <MarketingTrackedLocaleLink
                      href="/#waitlist"
                      ctaId={MarketingCtaId.HERO_WAITLIST_INLINE_NOTIFY}
                      eventProperties={{ hero_variant: heroVariant, intent: "notify_me" }}
                      className="font-medium text-vermilion-600 transition-colors duration-80 ease-(--ease-editorial) hover:text-vermilion-700"
                    >
                      {t("ctaWaitlistNotifyB")}
                    </MarketingTrackedLocaleLink>
                    <span aria-hidden className="mx-2 text-ink-300">
                      ·
                    </span>
                    {t("ctaSignUpHintB2")}{" "}
                    <MarketingTrackedNextLink
                      href="/signup"
                      ctaId={MarketingCtaId.HERO_SIGNUP}
                      eventProperties={{ hero_variant: heroVariant, intent: "read_now" }}
                      className="font-medium text-vermilion-600 transition-colors duration-80 ease-(--ease-editorial) hover:text-vermilion-700"
                    >
                      {t("ctaSignUpB")}
                    </MarketingTrackedNextLink>
                  </>
                )}
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

      <section className="border-b border-ink-100 bg-paper-100">
        <div className="elevate-marketing-shell">
          <div className="grid grid-cols-2 lg:grid-cols-4">
            {pillars.map((p, i) => (
              <div
                key={p.title}
                className={`px-4 py-8 sm:px-6 ${i < 3 ? "border-r border-ink-100" : ""}`}
              >
                <div className="text-[length:var(--elevate-prose-body-size)] font-medium leading-snug text-ink-900">
                  {p.title}
                </div>
                <div className="mt-2 text-[length:var(--elevate-prose-body-size)] leading-[var(--elevate-prose-body-leading)] text-ink-500">
                  {p.sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-ink-100">
        <div className="elevate-marketing-shell py-14 sm:py-16 lg:py-20">
          <div className="mb-10 max-w-2xl sm:mb-12">
            <h2 className="text-[length:var(--elevate-marketing-section-title-size)] font-semibold tracking-[-0.02em] text-ink-900">
              {t("sectionCapabilitiesTitle")}
            </h2>
            <p className="mt-3 text-[length:var(--elevate-marketing-lead-size)] leading-[var(--elevate-prose-body-leading)] text-ink-700">
              {t("sectionCapabilitiesSub")}
            </p>
          </div>

          <div className="grid gap-px border border-ink-100 bg-ink-100 md:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((cap) => (
              <Card
                key={cap.title}
                className="elevate-interactive-subtle border-0 bg-paper-100 hover:bg-paper-50"
              >
                <CardContent className="p-5 sm:p-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center border border-ink-100 bg-paper-50 text-vermilion-600">
                    {cap.icon}
                  </div>
                  <h3 className="mb-2 text-[length:var(--elevate-marketing-lead-size)] font-semibold text-ink-900">
                    {cap.title}
                  </h3>
                  <p className="text-[length:var(--elevate-prose-body-size)] leading-[var(--elevate-prose-body-leading)] text-ink-500">
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
        className="border-b border-ink-100 bg-paper-100 scroll-mt-20"
      >
        <div className="elevate-marketing-shell py-14 sm:py-16">
          <div className="max-w-xl">
            <h2 className="text-[length:var(--elevate-marketing-section-title-size)] font-semibold tracking-[-0.02em] text-ink-900">
              {t("sectionWaitlistTitle")}
            </h2>
            <p className="mt-3 text-[length:var(--elevate-marketing-lead-size)] leading-[var(--elevate-prose-body-leading)] text-ink-700">
              {t("sectionWaitlistSub")}
            </p>
            <WaitlistForm
              source="home"
              className="mt-8"
              analyticsContext={{ hero_variant: heroVariant }}
            />
          </div>
        </div>
      </section>

      <section className="border-b border-ink-100 bg-paper-100">
        <div className="elevate-marketing-shell py-14 sm:py-16 lg:py-20">
          <div className="max-w-xl">
            <Badge variant="green" className="mb-4">
              {t("resourcesBadge")}
            </Badge>
            <h2 className="text-[length:var(--elevate-marketing-section-title-size)] font-semibold tracking-[-0.02em] text-ink-900">
              {t("resourcesTitle")}
            </h2>
            <p className="mt-3 text-[length:var(--elevate-marketing-lead-size)] leading-[var(--elevate-prose-body-leading)] text-ink-500">
              {t("resourcesBody")}
            </p>
            <Link
              href="/blog"
              className="elevate-interactive-subtle mt-6 inline-flex items-center gap-1.5 text-[length:var(--elevate-prose-body-size)] font-medium text-vermilion-600 hover:text-vermilion-700"
            >
              {t("resourcesCta")}
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-ink-100 bg-ink-900 text-paper-50 dark:bg-paper-0 dark:text-ink-900">
        <div className="elevate-marketing-shell py-14 sm:py-16">
          <div className="max-w-2xl">
            <h2 className="text-[length:var(--elevate-marketing-section-title-size)] font-semibold tracking-[-0.02em] text-paper-50 dark:text-ink-900">
              {t("ctaBandTitle")}
            </h2>
            <p className="mt-2 text-[length:var(--elevate-marketing-lead-size)] leading-[var(--elevate-prose-body-leading)] text-paper-100 dark:text-ink-700">
              {t("ctaBandSub")}
            </p>
            <WaitlistForm
              source="band"
              variant="panel"
              className="mt-8 max-w-xl"
              analyticsContext={{ hero_variant: heroVariant }}
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
                className="w-full border border-paper-50/45 bg-paper-50 px-6 font-semibold text-ink-900 transition-colors duration-80 ease-(--ease-editorial) hover:bg-paper-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper-50 dark:border-ink-900 dark:bg-ink-900 dark:text-paper-50 dark:hover:bg-ink-700 dark:focus-visible:outline-ink-900 sm:min-w-48 sm:w-auto"
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
