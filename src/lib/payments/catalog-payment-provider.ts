/**
 * Catalog checkout UX: Lemon Squeezy (hosted) is the default; Toss remains opt-in for PoC/dev.
 * Set `NEXT_PUBLIC_CATALOG_PAYMENT_PROVIDER=toss` only when Toss keys are approved and configured.
 */
export type CatalogPaymentProvider = "lemon" | "toss";

export function getCatalogPaymentProvider(): CatalogPaymentProvider {
  const raw = process.env.NEXT_PUBLIC_CATALOG_PAYMENT_PROVIDER?.trim().toLowerCase();
  if (raw === "toss") {
    return "toss";
  }
  return "lemon";
}
