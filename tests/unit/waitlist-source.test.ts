import { describe, expect, it } from "vitest";
import {
  normalizeWaitlistSource,
  WAITLIST_SOURCE_VALUES,
} from "@/lib/waitlist/sources";

describe("normalizeWaitlistSource", () => {
  it("returns known sources", () => {
    for (const s of WAITLIST_SOURCE_VALUES) {
      expect(normalizeWaitlistSource(s)).toBe(s);
    }
  });

  it("defaults unknown or empty to home", () => {
    expect(normalizeWaitlistSource("unknown")).toBe("home");
    expect(normalizeWaitlistSource("")).toBe("home");
    expect(normalizeWaitlistSource(null)).toBe("home");
    expect(normalizeWaitlistSource(1)).toBe("home");
  });
});
