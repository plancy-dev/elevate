import { describe, expect, it } from "vitest";
import { normalizePurchaseAllowlistEmail } from "@/lib/payments/purchase-allowlist";

describe("normalizePurchaseAllowlistEmail", () => {
  it("trims and lowercases", () => {
    expect(normalizePurchaseAllowlistEmail("  User@EXAMPLE.com  ")).toBe(
      "user@example.com",
    );
  });
});
