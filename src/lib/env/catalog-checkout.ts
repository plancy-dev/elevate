/**
 * When `true`, catalog checkout paths that enforce allowlist require
 * `profiles.email` (normalized) to exist in `catalog_purchase_allowlist`.
 * Default unset/false: no allowlist gate (local dev and gradual rollout).
 */
export function isCatalogCheckoutAllowlistRequired(): boolean {
  return process.env.CATALOG_CHECKOUT_REQUIRE_ALLOWLIST === "true";
}
