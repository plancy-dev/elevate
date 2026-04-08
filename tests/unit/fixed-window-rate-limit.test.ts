import { describe, expect, it } from "vitest";
import {
  checkFixedWindowRateLimit,
  type RateLimitBucket,
} from "@/lib/api/fixed-window-rate-limit";

describe("checkFixedWindowRateLimit", () => {
  it("allows up to max requests in one window", () => {
    const store = new Map<string, RateLimitBucket>();
    const opts = {
      max: 2,
      windowMs: 60_000,
      nowMs: 1_000_000,
      store,
    };
    expect(checkFixedWindowRateLimit("a", opts)).toEqual({ ok: true });
    expect(checkFixedWindowRateLimit("a", opts)).toEqual({ ok: true });
    const third = checkFixedWindowRateLimit("a", { ...opts, nowMs: 1_000_000 });
    expect(third.ok).toBe(false);
    if (!third.ok) {
      expect(third.retryAfterSec).toBeGreaterThan(0);
    }
  });

  it("resets after window elapses", () => {
    const store = new Map<string, RateLimitBucket>();
    const windowMs = 60_000;
    const t0 = 1_000_000;
    checkFixedWindowRateLimit("k", {
      max: 1,
      windowMs,
      nowMs: t0,
      store,
    });
    const blocked = checkFixedWindowRateLimit("k", {
      max: 1,
      windowMs,
      nowMs: t0 + 1000,
      store,
    });
    expect(blocked.ok).toBe(false);
    const after = checkFixedWindowRateLimit("k", {
      max: 1,
      windowMs,
      nowMs: t0 + windowMs,
      store,
    });
    expect(after.ok).toBe(true);
  });

  it("isolates keys", () => {
    const store = new Map<string, RateLimitBucket>();
    const opts = { max: 1, windowMs: 10_000, nowMs: 5_000, store };
    expect(checkFixedWindowRateLimit("u1", opts).ok).toBe(true);
    expect(checkFixedWindowRateLimit("u2", opts).ok).toBe(true);
  });
});
