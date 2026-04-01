"use client";

import { useEffect, useRef, useState } from "react";
import { ANONYMOUS, loadTossPayments } from "@tosspayments/tosspayments-sdk";
import { createTossPaymentIntent } from "@/actions/toss-payments";
import { TOSS_POC_AMOUNT_KRW } from "@/lib/payments/toss-poc";

type WidgetsApi = {
  setAmount: (p: { currency: string; value: number }) => Promise<void>;
  renderPaymentMethods: (p: {
    selector: string;
    variantKey?: string;
  }) => Promise<unknown>;
  renderAgreement: (p: {
    selector: string;
    variantKey?: string;
  }) => Promise<unknown>;
  requestPayment: (p: Record<string, unknown>) => Promise<void>;
};

type Props = {
  clientKey: string;
  /** Toss customerKey: stable per user (UUID). */
  customerKey: string;
  appOrigin: string;
  customerEmail: string | null;
  customerName: string | null;
  /** When set, successful payment grants org entitlement for this catalog slug (PoC price must match). */
  contentProductSlug?: string | null;
};

export function BillingTossWidget({
  clientKey,
  customerKey,
  appOrigin,
  customerEmail,
  customerName,
  contentProductSlug,
}: Props) {
  const widgetsRef = useRef<WidgetsApi | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const toss = await loadTossPayments(clientKey);
        const ck =
          customerKey.length >= 2 && customerKey.length <= 50
            ? customerKey
            : ANONYMOUS;
        const widgets = toss.widgets({
          customerKey: ck,
        }) as unknown as WidgetsApi;
        await widgets.setAmount({
          currency: "KRW",
          value: TOSS_POC_AMOUNT_KRW,
        });
        await widgets.renderPaymentMethods({
          selector: "#toss-payment-methods",
          variantKey: "DEFAULT",
        });
        await widgets.renderAgreement({
          selector: "#toss-agreement",
          variantKey: "AGREEMENT",
        });
        if (!cancelled) {
          widgetsRef.current = widgets;
          setReady(true);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load Toss widget");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clientKey, customerKey]);

  async function handlePay() {
    setError(null);
    setBusy(true);
    try {
      const intent = await createTossPaymentIntent(
        TOSS_POC_AMOUNT_KRW,
        contentProductSlug ?? null,
      );
      if (!intent.ok) {
        setError(intent.error);
        return;
      }
      const widgets = widgetsRef.current;
      if (!widgets) {
        setError("Payment UI is not ready yet.");
        return;
      }
      await widgets.setAmount({
        currency: "KRW",
        value: intent.amountKrw,
      });
      await widgets.requestPayment({
        orderId: intent.orderId,
        orderName: contentProductSlug
          ? `Elevate — ${contentProductSlug}`
          : "Elevate PoC (test)",
        successUrl: `${appOrigin}/dashboard/billing/success`,
        failUrl: `${appOrigin}/dashboard/billing/fail`,
        customerEmail: customerEmail ?? undefined,
        customerName: customerName ?? "Member",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment request failed");
    } finally {
      setBusy(false);
    }
  }

  if (error && !ready) {
    return (
      <p className="text-sm text-danger" role="alert">
        {error}
      </p>
    );
  }

  return (
    <div className="space-y-4 max-w-lg">
      <div id="toss-payment-methods" className="min-h-[120px]" />
      <div id="toss-agreement" className="min-h-[80px]" />
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => void handlePay()}
        disabled={!ready || busy}
        className="rounded-sm bg-primary px-4 py-2 text-sm font-medium text-text-on-color hover:bg-primary-hover disabled:opacity-50"
      >
        {busy ? "Opening…" : "Pay test amount (100 KRW)"}
      </button>
      {!ready ? (
        <p className="text-xs text-text-tertiary">Loading payment methods…</p>
      ) : null}
    </div>
  );
}
