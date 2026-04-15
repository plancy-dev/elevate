/**
 * One-time billing return toast: append `?billingReturn=success|fail` to
 * `/dashboard/billing/success` or `/dashboard/billing/fail` URLs.
 * `BillingReturnFlashToast` shows the toast and strips the param via `router.replace`.
 */
export const BILLING_RETURN_FLASH_QUERY = "billingReturn" as const;

export type BillingReturnFlashValue = "success" | "fail";

export function isBillingReturnFlashValue(
  v: string | null,
): v is BillingReturnFlashValue {
  return v === "success" || v === "fail";
}
