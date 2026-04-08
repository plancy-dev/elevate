/**
 * In-memory fixed-window rate limiter (per-process).
 *
 * On Vercel/serverless, each instance has its own map — abuse is throttled per
 * warm instance; for **global** limits use Redis/Upstash or Vercel Firewall.
 */

export type RateLimitBucket = {
  count: number;
  /** Epoch ms when this window expires and the counter resets */
  resetAt: number;
};

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSec: number };

export function checkFixedWindowRateLimit(
  key: string,
  options: {
    max: number;
    windowMs: number;
    nowMs: number;
    store: Map<string, RateLimitBucket>;
  },
): RateLimitResult {
  const { max, windowMs, nowMs, store } = options;
  const bucket = store.get(key);

  if (!bucket || nowMs >= bucket.resetAt) {
    store.set(key, { count: 1, resetAt: nowMs + windowMs });
    return { ok: true };
  }

  if (bucket.count >= max) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((bucket.resetAt - nowMs) / 1000),
    );
    return { ok: false, retryAfterSec };
  }

  bucket.count += 1;
  return { ok: true };
}
