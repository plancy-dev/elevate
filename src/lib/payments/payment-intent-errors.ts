/**
 * Machine codes returned by `createTossPaymentIntent` for client i18n
 * (`Dashboard.billing.errors.*` and `Dashboard.actionErrors.*`).
 */
export const PaymentIntentErrorCode = {
  pocAmountOnly: "pocAmountOnly",
  missingWidgetKey: "missingWidgetKey",
  catalogUnknown: "catalogUnknown",
  catalogPriceMismatch: "catalogPriceMismatch",
  paymentServerConfig: "paymentServerConfig",
  intentCreateFailed: "intentCreateFailed",
  /** `CATALOG_CHECKOUT_REQUIRE_ALLOWLIST=true` and email not on `catalog_purchase_allowlist` */
  checkoutAllowlistDenied: "checkoutAllowlistDenied",
  /** Profile has no email — cannot match allowlist */
  checkoutAllowlistNoEmail: "checkoutAllowlistNoEmail",
} as const;

export type PaymentIntentErrorCode =
  (typeof PaymentIntentErrorCode)[keyof typeof PaymentIntentErrorCode];

const SET = new Set<string>(Object.values(PaymentIntentErrorCode));

export function isPaymentIntentErrorCode(
  value: string,
): value is PaymentIntentErrorCode {
  return SET.has(value);
}
