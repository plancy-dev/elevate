import { describe, it, expect } from "vitest";
import { MarketingCtaId } from "@/lib/analytics/posthog-events";

/**
 * ADR-013 Phase 1 contract: the MarketingCtaId wire-value set is a
 * stable allowlist. Renames, deletions, or duplicates must fail CI.
 */
describe("MarketingCtaId — ADR-013 Phase 1 stable values", () => {
  const EXPECTED_WIRE_VALUES = [
    // Pre-Phase-1 (do not change)
    "hero_ebooks",
    "hero_waitlist_anchor",
    "hero_waitlist_inline_notify",
    "hero_prompt_studio",
    "hero_signup",
    "band_contact",
    // Phase 1 additions (ADR-013 Decision #2)
    "hero_pricing",
    "header_nav_pricing",
    "header_nav_blog",
    "band_waitlist",
    "blog_post_footer_waitlist",
    "blog_post_footer_pricing",
    "pricing_card_monthly",
    "pricing_card_annual",
  ] as const;

  it("includes exactly the 14 stable wire values", () => {
    const actual = Object.values(MarketingCtaId).slice().sort();
    const expected = [...EXPECTED_WIRE_VALUES].sort();
    expect(actual).toEqual(expected);
  });

  it("uses snake_case wire values matching ^[a-z][a-z0-9_]*$", () => {
    const pattern = /^[a-z][a-z0-9_]*$/;
    for (const value of Object.values(MarketingCtaId)) {
      expect(value).toMatch(pattern);
    }
  });

  it("has no duplicate wire values", () => {
    const values = Object.values(MarketingCtaId);
    expect(new Set(values).size).toBe(values.length);
  });

  it("preserves the 6 pre-Phase-1 keys unchanged", () => {
    expect(MarketingCtaId.HERO_EBOOKS).toBe("hero_ebooks");
    expect(MarketingCtaId.HERO_WAITLIST_ANCHOR).toBe("hero_waitlist_anchor");
    expect(MarketingCtaId.HERO_WAITLIST_INLINE_NOTIFY).toBe(
      "hero_waitlist_inline_notify",
    );
    expect(MarketingCtaId.HERO_PROMPT_STUDIO).toBe("hero_prompt_studio");
    expect(MarketingCtaId.HERO_SIGNUP).toBe("hero_signup");
    expect(MarketingCtaId.BAND_CONTACT).toBe("band_contact");
  });
});
