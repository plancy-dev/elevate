/**
 * Machine codes for catalog checkout allowlist gates (`Dashboard.billing.errors.*`).
 */
export const PaymentIntentErrorCode = {
  /** `CATALOG_CHECKOUT_REQUIRE_ALLOWLIST=true` and email not on `catalog_purchase_allowlist` */
  checkoutAllowlistDenied: "checkoutAllowlistDenied",
  /** Profile has no email — cannot match allowlist */
  checkoutAllowlistNoEmail: "checkoutAllowlistNoEmail",
  /** Fallback when a checkout URL carries an unknown `error` code */
  generic: "generic",
} as const;

export type PaymentIntentErrorCode =
  (typeof PaymentIntentErrorCode)[keyof typeof PaymentIntentErrorCode];

const SET = new Set<string>(Object.values(PaymentIntentErrorCode));

export function isPaymentIntentErrorCode(
  value: string,
): value is PaymentIntentErrorCode {
  return SET.has(value);
}
