/**
 * Maps `content_products.slug` → Lemon hosted checkout URL (Share link).
 * Set `NEXT_PUBLIC_LEMON_CHECKOUT_URL_BY_SLUG` to JSON, e.g. `{"my-guide":"https://....lemonsqueezy.com/checkout/buy/..."}`.
 */
export function parseLemonCheckoutUrlBySlug(): Record<string, string> {
  const raw = process.env.NEXT_PUBLIC_LEMON_CHECKOUT_URL_BY_SLUG?.trim();
  if (!raw) {
    return {};
  }
  try {
    const o = JSON.parse(raw) as unknown;
    if (!o || typeof o !== "object" || Array.isArray(o)) {
      return {};
    }
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(o as Record<string, unknown>)) {
      if (typeof v === "string" && v.trim().startsWith("http")) {
        out[k.trim()] = v.trim();
      }
    }
    return out;
  } catch {
    return {};
  }
}

export function getLemonCheckoutUrlForSlug(slug: string): string | null {
  const map = parseLemonCheckoutUrlBySlug();
  const url = map[slug];
  return url ?? null;
}
