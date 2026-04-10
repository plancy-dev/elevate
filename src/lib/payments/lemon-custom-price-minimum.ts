/**
 * Lemon Squeezy hosted checkout validates `custom_price` against a floor that
 * depends on currency. For KRW stores the API rejects amounts below roughly one
 * USD equivalent (observed: ₩741 as of 2025–2026).
 *
 * Our `content_products.price_cents` stores KRW × 100 (same integer scale we pass
 * to `custom_price` for catalog checkouts).
 *
 * @see https://docs.lemonsqueezy.com/api/checkouts/create-checkout (custom_price)
 */
export const LEMON_CUSTOM_PRICE_MIN_KRW = 741;

const MIN_PRICE_CENTS_KRW = LEMON_CUSTOM_PRICE_MIN_KRW * 100;

export function contentProductPriceMeetsLemonMinimum(
  priceCents: number,
  currency: string | null | undefined,
): boolean {
  if ((currency ?? "KRW").toUpperCase() !== "KRW") {
    return true;
  }
  if (!Number.isFinite(priceCents) || priceCents < 0) {
    return false;
  }
  return priceCents >= MIN_PRICE_CENTS_KRW;
}
