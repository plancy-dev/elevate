import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { MarketingCtaId } from "@/lib/analytics/posthog-events";
import { buildMarketingCtaClickProperties } from "@/lib/analytics/marketing-cta-click-properties";
import { routing } from "@/i18n/routing";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

function readSrc(rel: string): string {
  return readFileSync(join(repoRoot, rel), "utf8");
}

describe("Marketing CTA instrumentation — ADR-013 Phase 1b", () => {
  it("buildMarketingCtaClickProperties enforces cta_id and locale (ADR contract)", () => {
    const p = buildMarketingCtaClickProperties({
      ctaId: MarketingCtaId.HERO_PRICING,
      locale: "ko",
      eventProperties: { hero_variant: "A", slug: "some-post" },
      referrerPath: "/ko/blog/foo",
    });
    expect(p.cta_id).toBe(MarketingCtaId.HERO_PRICING);
    expect(p.locale).toBe("ko");
    expect(p.referrer_path).toBe("/ko/blog/foo");
    expect(p.slug).toBe("some-post");
    expect(p.hero_variant).toBe("A");
  });

  it("routing locales match ADR-013 allowed locale set (5-locale parity)", () => {
    const allowed = new Set(["en", "ko", "ja", "zh-CN", "zh-TW"]);
    expect(new Set(routing.locales)).toEqual(allowed);
  });

  it("wires all 8 ADR-013 Decision #2 surfaces in source", () => {
    const home = readSrc("src/app/[locale]/(marketing)/page.tsx");
    const header = readSrc("src/components/layout/header.tsx");
    const pricing = readSrc("src/app/[locale]/(marketing)/pricing/page.tsx");
    const blogPost = readSrc("src/app/[locale]/(marketing)/blog/[slug]/page.tsx");

    expect(home).toContain("MarketingCtaId.HERO_PRICING");
    expect(home).toContain("MarketingCtaId.BAND_WAITLIST");

    expect(header).toContain("MarketingCtaId.HEADER_NAV_BLOG");
    expect(header).toContain("MarketingCtaId.HEADER_NAV_PRICING");

    expect(pricing).toContain("MarketingCtaId.PRICING_CARD_MONTHLY");
    expect(pricing).toContain("MarketingCtaId.PRICING_CARD_ANNUAL");

    expect(blogPost).toContain("MarketingCtaId.BLOG_POST_FOOTER_WAITLIST");
    expect(blogPost).toContain("MarketingCtaId.BLOG_POST_FOOTER_PRICING");
  });
});
