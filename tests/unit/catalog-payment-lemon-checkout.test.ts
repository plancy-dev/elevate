import { afterEach, describe, expect, it, vi } from "vitest";
import { getLemonCheckoutUrlForSlug, parseLemonCheckoutUrlBySlug } from "@/lib/env/lemon-checkout-urls";
import { getCatalogPaymentProvider } from "@/lib/payments/catalog-payment-provider";

describe("getCatalogPaymentProvider", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults to lemon when unset", () => {
    vi.stubEnv("NEXT_PUBLIC_CATALOG_PAYMENT_PROVIDER", "");
    expect(getCatalogPaymentProvider()).toBe("lemon");
  });

  it("returns toss when set", () => {
    vi.stubEnv("NEXT_PUBLIC_CATALOG_PAYMENT_PROVIDER", "toss");
    expect(getCatalogPaymentProvider()).toBe("toss");
  });

  it("is case-insensitive", () => {
    vi.stubEnv("NEXT_PUBLIC_CATALOG_PAYMENT_PROVIDER", "TOSS");
    expect(getCatalogPaymentProvider()).toBe("toss");
  });
});

describe("parseLemonCheckoutUrlBySlug", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns empty when unset", () => {
    vi.stubEnv("NEXT_PUBLIC_LEMON_CHECKOUT_URL_BY_SLUG", "");
    expect(parseLemonCheckoutUrlBySlug()).toEqual({});
  });

  it("parses http(s) URLs and drops invalid values", () => {
    vi.stubEnv(
      "NEXT_PUBLIC_LEMON_CHECKOUT_URL_BY_SLUG",
      JSON.stringify({
        a: "https://example.com/buy",
        bad: "not-a-url",
        empty: "",
      }),
    );
    expect(parseLemonCheckoutUrlBySlug()).toEqual({ a: "https://example.com/buy" });
  });

  it("getLemonCheckoutUrlForSlug returns mapped URL or null", () => {
    vi.stubEnv(
      "NEXT_PUBLIC_LEMON_CHECKOUT_URL_BY_SLUG",
      JSON.stringify({ guide: "https://lemonsqueezy.com/c" }),
    );
    expect(getLemonCheckoutUrlForSlug("guide")).toBe("https://lemonsqueezy.com/c");
    expect(getLemonCheckoutUrlForSlug("missing")).toBeNull();
  });
});
