import { describe, expect, it } from "vitest";
import { deriveSubscriptionState } from "@/lib/payments/lemon-squeezy-subscription-webhook";

describe("deriveSubscriptionState", () => {
  it("sets free tier on subscription_expired", () => {
    const next = deriveSubscriptionState({
      eventName: "subscription_expired",
      variantTier: "annual",
      existingTier: "annual",
    });
    expect(next).toEqual({
      tier: "free",
      status: "expired",
    });
  });

  it("keeps paid tier for cancelled/past events when variant is missing", () => {
    const cancelled = deriveSubscriptionState({
      eventName: "subscription_cancelled",
      variantTier: null,
      existingTier: "monthly",
    });
    const updated = deriveSubscriptionState({
      eventName: "subscription_updated",
      variantTier: null,
      existingTier: "annual",
    });
    expect(cancelled).toEqual({
      tier: "monthly",
      status: "cancelled",
    });
    expect(updated).toEqual({
      tier: "annual",
      status: "active",
    });
  });
});
