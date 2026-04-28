import { describe, expect, it } from "vitest";
import {
  buildBlogSubscriptionCheckoutUrl,
  canReadPremiumBlogPost,
  LEMON_ANNUAL_VARIANT_ID,
  LEMON_MONTHLY_VARIANT_ID,
  mapVariantIdToBlogTier,
} from "@/lib/subscriptions/blog-subscription";

describe("mapVariantIdToBlogTier", () => {
  it("maps fixed Lemon variant ids to monthly/annual", () => {
    expect(mapVariantIdToBlogTier(LEMON_MONTHLY_VARIANT_ID)).toBe("monthly");
    expect(mapVariantIdToBlogTier(String(LEMON_ANNUAL_VARIANT_ID))).toBe("annual");
  });

  it("returns null for unknown variants", () => {
    expect(mapVariantIdToBlogTier(9999999)).toBeNull();
    expect(mapVariantIdToBlogTier(null)).toBeNull();
  });
});

describe("buildBlogSubscriptionCheckoutUrl", () => {
  it("adds checkout[email] when email is provided", () => {
    const url = buildBlogSubscriptionCheckoutUrl({
      variantId: LEMON_MONTHLY_VARIANT_ID,
      email: "user@example.com",
    });
    expect(url).toContain(`/checkout/buy/${LEMON_MONTHLY_VARIANT_ID}`);
    expect(url).toContain("checkout%5Bemail%5D=user%40example.com");
  });

  it("returns plain hosted checkout url for guest users", () => {
    const url = buildBlogSubscriptionCheckoutUrl({
      variantId: LEMON_ANNUAL_VARIANT_ID,
      email: null,
    });
    expect(url).toBe(`https://elevate.lemonsqueezy.com/checkout/buy/${LEMON_ANNUAL_VARIANT_ID}`);
  });
});

describe("canReadPremiumBlogPost", () => {
  it("always allows non-premium posts", () => {
    const decision = canReadPremiumBlogPost({
      isPremium: false,
      subscription: {
        tier: "free",
        status: null,
        currentPeriodEnd: null,
        manageSubscriptionUrl: null,
        lemonSubscriptionId: null,
        lemonVariantId: null,
      },
    });
    expect(decision.canReadFull).toBe(true);
  });

  it("requires active monthly/annual for premium posts", () => {
    const monthlyActive = canReadPremiumBlogPost({
      isPremium: true,
      subscription: {
        tier: "monthly",
        status: "active",
        currentPeriodEnd: null,
        manageSubscriptionUrl: null,
        lemonSubscriptionId: null,
        lemonVariantId: null,
      },
    });
    const annualExpired = canReadPremiumBlogPost({
      isPremium: true,
      subscription: {
        tier: "annual",
        status: "expired",
        currentPeriodEnd: null,
        manageSubscriptionUrl: null,
        lemonSubscriptionId: null,
        lemonVariantId: null,
      },
    });
    expect(monthlyActive.canReadFull).toBe(true);
    expect(annualExpired.canReadFull).toBe(false);
  });
});
