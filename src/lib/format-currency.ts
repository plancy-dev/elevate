/** Format minor units (e.g. cents) as currency for display. */
export function formatCurrencyMinor(
  minorUnits: number,
  currency: string,
  locale?: string,
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency || "USD",
  }).format(minorUnits / 100);
}
