import { describe, expect, it } from "vitest";

/** Mirrors the shape returned by POST /v1/checkouts */
function readCheckoutUrlFromJsonApi(json: unknown): string | null {
  const o = json as { data?: { attributes?: { url?: string } } };
  const url = o?.data?.attributes?.url;
  return typeof url === "string" && url.startsWith("http") ? url : null;
}

describe("Lemon checkout JSON:API response", () => {
  it("reads checkout URL from create-checkout response", () => {
    const url = readCheckoutUrlFromJsonApi({
      data: {
        attributes: {
          url: "https://my-store.lemonsqueezy.com/checkout/custom/5e8b546c-c561-4a2c-a586-40c18bb2a195?expires=1&sig=x",
        },
      },
    });
    expect(url).toContain("lemonsqueezy.com/checkout/custom/");
  });

  it("returns null when url missing", () => {
    expect(readCheckoutUrlFromJsonApi({ data: {} })).toBeNull();
  });
});
