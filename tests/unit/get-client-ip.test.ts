import { describe, expect, it } from "vitest";
import { getClientIpFromHeaders } from "@/lib/api/get-client-ip";

describe("getClientIpFromHeaders", () => {
  it("returns the first address in x-forwarded-for", () => {
    const h = new Headers();
    h.set("x-forwarded-for", "203.0.113.1, 198.51.100.2");
    expect(getClientIpFromHeaders(h)).toBe("203.0.113.1");
  });

  it("falls back to x-real-ip", () => {
    const h = new Headers();
    h.set("x-real-ip", "192.0.2.1");
    expect(getClientIpFromHeaders(h)).toBe("192.0.2.1");
  });

  it("returns unknown when no proxy headers are present", () => {
    expect(getClientIpFromHeaders(new Headers())).toBe("unknown");
  });
});
