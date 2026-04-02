import { describe, expect, it } from "vitest";
import { hasPaidServiceSubscription } from "@/lib/organizations/plan";

describe("hasPaidServiceSubscription", () => {
  it("returns false for null or starter", () => {
    expect(hasPaidServiceSubscription(null)).toBe(false);
    expect(hasPaidServiceSubscription("starter")).toBe(false);
  });

  it("returns true for professional or enterprise", () => {
    expect(hasPaidServiceSubscription("professional")).toBe(true);
    expect(hasPaidServiceSubscription("enterprise")).toBe(true);
  });
});
