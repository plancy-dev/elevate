import { getTossConfirmSecretKey } from "@/lib/env/toss";

type ConfirmBody = {
  paymentKey: string;
  orderId: string;
  amount: number;
};

export type TossConfirmResult =
  | { ok: true; data: unknown }
  | { ok: false; message: string; status?: number };

/**
 * POST /v1/payments/confirm — Authorization Basic base64(secretKey + ':').
 */
export async function tossConfirmPayment(
  body: ConfirmBody,
): Promise<TossConfirmResult> {
  const secret = getTossConfirmSecretKey();
  if (!secret) {
    return { ok: false, message: "Missing TOSS_WIDGET_SECRET_KEY or TOSS_SECRET_KEY" };
  }
  const auth = Buffer.from(`${secret}:`).toString("base64");
  const res = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof (data as { message: unknown }).message === "string"
        ? (data as { message: string }).message
        : res.statusText;
    return { ok: false, message: msg, status: res.status };
  }
  return { ok: true, data };
}
