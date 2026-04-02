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
} as const;

export type PaymentIntentErrorCode =
  (typeof PaymentIntentErrorCode)[keyof typeof PaymentIntentErrorCode];

const SET = new Set<string>(Object.values(PaymentIntentErrorCode));

export function isPaymentIntentErrorCode(
  value: string,
): value is PaymentIntentErrorCode {
  return SET.has(value);
}
