/**
 * Catalog checkout: Lemon Squeezy (hosted) is the supported rail.
 * `NEXT_PUBLIC_CATALOG_PAYMENT_PROVIDER` is ignored at runtime (legacy `toss` removed).
 */
export type CatalogPaymentProvider = "lemon";

export function getCatalogPaymentProvider(): CatalogPaymentProvider {
  return "lemon";
}
