import { describe, expect, it } from "vitest";
import { derivePolarSubscriptionState } from "@/lib/payments/polar-subscription-webhook";
import {
  POLAR_ANNUAL_PRODUCT_ID,
  POLAR_MONTHLY_PRODUCT_ID,
} from "@/lib/subscriptions/blog-subscription";

describe("derivePolarSubscriptionState", () => {
  it("maps Polar product ids to monthly/annual on active lifecycle events", () => {
    expect(
      derivePolarSubscriptionState({
        eventType: "subscription.created",
        payloadStatus: "active",
        productId: POLAR_MONTHLY_PRODUCT_ID,
        existingTier: null,
      }),
    ).toEqual({ tier: "monthly", status: "active" });

    expect(
      derivePolarSubscriptionState({
        eventType: "subscription.updated",
        payloadStatus: "active",
        productId: POLAR_ANNUAL_PRODUCT_ID,
        existingTier: null,
      }),
    ).toEqual({ tier: "annual", status: "active" });
  });

  it("keeps paid tier but sets cancelled for canceled status", () => {
    expect(
      derivePolarSubscriptionState({
        eventType: "subscription.canceled",
        payloadStatus: "canceled",
        productId: null,
        existingTier: "annual",
      }),
    ).toEqual({ tier: "annual", status: "cancelled" });
  });

  it("downgrades to free on revoked", () => {
    expect(
      derivePolarSubscriptionState({
        eventType: "subscription.revoked",
        payloadStatus: "canceled",
        productId: POLAR_MONTHLY_PRODUCT_ID,
        existingTier: "monthly",
      }),
    ).toEqual({ tier: "free", status: "expired" });
  });
});

