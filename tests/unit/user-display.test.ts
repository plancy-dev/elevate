import { describe, expect, it } from "vitest";
import { getInitialsFromDisplayName } from "@/lib/user-display";

describe("getInitialsFromDisplayName", () => {
  it("uses two letters for two words", () => {
    expect(getInitialsFromDisplayName("Jane Doe")).toBe("JD");
  });

  it("uses first two letters for single token", () => {
    expect(getInitialsFromDisplayName("jaekyeon")).toBe("JA");
  });

  it("returns placeholder for empty string", () => {
    expect(getInitialsFromDisplayName("   ")).toBe("?");
  });

  it("trims whitespace", () => {
    expect(getInitialsFromDisplayName("  A B  ")).toBe("AB");
  });
});
