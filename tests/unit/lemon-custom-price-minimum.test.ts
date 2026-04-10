import { describe, expect, it } from "vitest";
import {
  contentProductPriceMeetsLemonMinimum,
  LEMON_CUSTOM_PRICE_MIN_KRW,
} from "@/lib/payments/lemon-custom-price-minimum";

describe("contentProductPriceMeetsLemonMinimum", () => {
  const minCents = LEMON_CUSTOM_PRICE_MIN_KRW * 100;

  it("allows KRW at or above the Lemon floor", () => {
    expect(contentProductPriceMeetsLemonMinimum(minCents, "KRW")).toBe(true);
    expect(contentProductPriceMeetsLemonMinimum(minCents + 1, "KRW")).toBe(true);
  });

  it("rejects KRW below the Lemon floor (e.g. 100 KRW test products)", () => {
    expect(contentProductPriceMeetsLemonMinimum(100 * 100, "KRW")).toBe(false);
    expect(contentProductPriceMeetsLemonMinimum(minCents - 1, "KRW")).toBe(false);
  });

  it("defaults currency to KRW when null or empty", () => {
    expect(contentProductPriceMeetsLemonMinimum(100 * 100, null)).toBe(false);
    expect(contentProductPriceMeetsLemonMinimum(minCents, undefined)).toBe(true);
  });

  it("does not block non-KRW rows (API still validates)", () => {
    expect(contentProductPriceMeetsLemonMinimum(1, "USD")).toBe(true);
  });
});
