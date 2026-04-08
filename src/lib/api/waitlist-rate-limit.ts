import "server-only";

import {
  checkFixedWindowRateLimit,
  type RateLimitBucket,
  type RateLimitResult,
} from "@/lib/api/fixed-window-rate-limit";

const buckets = new Map<string, RateLimitBucket>();

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  const n = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/**
 * POST /api/waitlist — per client IP, in-process fixed window.
 * Env: `WAITLIST_RATE_LIMIT_MAX` (default 30), `WAITLIST_RATE_LIMIT_WINDOW_SEC` (default 60).
 */
export function consumeWaitlistRateLimitToken(
  clientIp: string,
  nowMs: number = Date.now(),
): RateLimitResult {
  const max = parsePositiveInt(process.env.WAITLIST_RATE_LIMIT_MAX, 30);
  const windowSec = parsePositiveInt(
    process.env.WAITLIST_RATE_LIMIT_WINDOW_SEC,
    60,
  );
  return checkFixedWindowRateLimit(`waitlist:${clientIp}`, {
    max,
    windowMs: windowSec * 1000,
    nowMs,
    store: buckets,
  });
}

/** Vitest only — clears in-memory buckets between tests. */
export function resetWaitlistRateLimitBucketsForTests(): void {
  buckets.clear();
}
