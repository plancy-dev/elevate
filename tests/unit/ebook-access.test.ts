import { describe, expect, it } from "vitest";
import { canReadCatalogProduct } from "@/lib/content/ebook-access";

describe("canReadCatalogProduct", () => {
  const pid = "00000000-0000-4000-8000-000000000001";

  it("returns true when org has professional plan without entitlement", () => {
    expect(
      canReadCatalogProduct({
        organizationPlan: "professional",
        entitledProductIds: new Set(),
        productId: pid,
      }),
    ).toBe(true);
  });

  it("returns true when org has enterprise plan", () => {
    expect(
      canReadCatalogProduct({
        organizationPlan: "enterprise",
        entitledProductIds: new Set(),
        productId: pid,
      }),
    ).toBe(true);
  });

  it("returns false for starter without entitlement", () => {
    expect(
      canReadCatalogProduct({
        organizationPlan: "starter",
        entitledProductIds: new Set(),
        productId: pid,
      }),
    ).toBe(false);
  });

  it("returns true when product id is entitled regardless of plan", () => {
    expect(
      canReadCatalogProduct({
        organizationPlan: "starter",
        entitledProductIds: new Set([pid]),
        productId: pid,
      }),
    ).toBe(true);
  });

  it("returns false when plan is null and not entitled", () => {
    expect(
      canReadCatalogProduct({
        organizationPlan: null,
        entitledProductIds: new Set(),
        productId: pid,
      }),
    ).toBe(false);
  });
});
