import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildBlogSubscriptionCheckoutUrl,
  canReadBlogPost,
  canReadPremiumBlogPost,
  POLAR_ANNUAL_PRODUCT_ID,
  POLAR_MONTHLY_PRODUCT_ID,
  mapVariantIdToBlogTier,
} from "@/lib/subscriptions/blog-subscription";

describe("mapVariantIdToBlogTier", () => {
  it("maps configured payment product ids to monthly/annual", () => {
    expect(mapVariantIdToBlogTier(POLAR_MONTHLY_PRODUCT_ID)).toBe("monthly");
    expect(mapVariantIdToBlogTier(String(POLAR_ANNUAL_PRODUCT_ID))).toBe("annual");
  });

  it("returns null for unknown variants", () => {
    expect(mapVariantIdToBlogTier(9999999)).toBeNull();
    expect(mapVariantIdToBlogTier(null)).toBeNull();
  });
});

describe("buildBlogSubscriptionCheckoutUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("adds Polar checkout params when email is provided", () => {
    const url = buildBlogSubscriptionCheckoutUrl({
      productId: POLAR_MONTHLY_PRODUCT_ID,
      email: "user@example.com",
    });
    expect(url).toContain("product_id=3e8c060a-93ee-4ef0-8d4d-b62e92d66a5a");
    expect(url).toContain("customer_email=user%40example.com");
  });

  it("returns Polar checkout url for guest users", () => {
    vi.stubEnv("NEXT_PUBLIC_POLAR_CHECKOUT_LINK", "");
    vi.stubEnv("POLAR_CHECKOUT_LINK", "");
    const url = buildBlogSubscriptionCheckoutUrl({
      productId: POLAR_ANNUAL_PRODUCT_ID,
      email: null,
    });
    expect(url).toContain("https://polar.sh/checkout");
    expect(url).toContain("product_id=fd78d399-dc29-4126-86a6-5a91a1215894");
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

describe("canReadBlogPost", () => {
  const freeSubscription = {
    tier: "free" as const,
    status: null,
    currentPeriodEnd: null,
    manageSubscriptionUrl: null,
    lemonSubscriptionId: null,
    lemonVariantId: null,
  };

  it("allows public posts for everyone", () => {
    const decision = canReadBlogPost({
      accessTier: "public",
      isAuthenticated: false,
      subscription: freeSubscription,
    });
    expect(decision.canReadFull).toBe(true);
    expect(decision.requiredAccessTier).toBe("public");
  });

  it("requires authentication for member-only posts", () => {
    const guestDecision = canReadBlogPost({
      accessTier: "member",
      isAuthenticated: false,
      subscription: freeSubscription,
    });
    const memberDecision = canReadBlogPost({
      accessTier: "member",
      isAuthenticated: true,
      subscription: freeSubscription,
    });
    expect(guestDecision.canReadFull).toBe(false);
    expect(memberDecision.canReadFull).toBe(true);
    expect(guestDecision.requiredAccessTier).toBe("member");
  });

  it("requires active paid subscription for premium posts", () => {
    const paidActive = canReadBlogPost({
      accessTier: "premium",
      isAuthenticated: true,
      subscription: { ...freeSubscription, tier: "monthly", status: "active" },
    });
    const paidExpired = canReadBlogPost({
      accessTier: "premium",
      isAuthenticated: true,
      subscription: { ...freeSubscription, tier: "annual", status: "expired" },
    });
    expect(paidActive.canReadFull).toBe(true);
    expect(paidExpired.canReadFull).toBe(false);
    expect(paidExpired.requiredAccessTier).toBe("premium");
  });
});
