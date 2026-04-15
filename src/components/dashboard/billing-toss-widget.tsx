"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ANONYMOUS, loadTossPayments } from "@tosspayments/tosspayments-sdk";
import { createTossPaymentIntent } from "@/actions/toss-payments";
import { isActionErrorCode } from "@/lib/i18n/action-error-codes";
import { translateActionErrorMessage } from "@/lib/i18n/translate-action-error";
import {
  isPaymentIntentErrorCode,
  PaymentIntentErrorCode,
} from "@/lib/payments/payment-intent-errors";
import { isUnhelpfulTossClientErrorMessage } from "@/lib/payments/toss-widget-user-message";
import { BILLING_RETURN_FLASH_QUERY } from "@/lib/billing/billing-return-flash";
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
  const t = useTranslations("Dashboard.billing");
  const tAction = useTranslations("Dashboard.actionErrors");
  const widgetsRef = useRef<WidgetsApi | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function formatIntentError(code: string): string {
    if (isActionErrorCode(code)) {
      return translateActionErrorMessage(code, (key, values) =>
        tAction(key, values as { max?: number }),
      );
    }
    if (isPaymentIntentErrorCode(code)) {
      if (code === PaymentIntentErrorCode.pocAmountOnly) {
        return t("errors.pocAmountOnly", { amount: TOSS_POC_AMOUNT_KRW });
      }
      if (code === PaymentIntentErrorCode.catalogPriceMismatch) {
        return t("errors.catalogPriceMismatch", { amount: TOSS_POC_AMOUNT_KRW });
      }
      if (code === PaymentIntentErrorCode.missingWidgetKey) {
        return t("errors.missingWidgetKey");
      }
      if (code === PaymentIntentErrorCode.catalogUnknown) {
        return t("errors.catalogUnknown");
      }
      if (code === PaymentIntentErrorCode.paymentServerConfig) {
        return t("errors.paymentServerConfig");
      }
      if (code === PaymentIntentErrorCode.intentCreateFailed) {
        return t("errors.intentCreateFailed");
      }
      if (code === PaymentIntentErrorCode.checkoutAllowlistDenied) {
        return t("errors.checkoutAllowlistDenied");
      }
      if (code === PaymentIntentErrorCode.checkoutAllowlistNoEmail) {
        return t("errors.checkoutAllowlistNoEmail");
      }
    }
    return t("errors.generic");
  }

  const formatThrownPaymentError = useCallback(
    (e: unknown): string => {
      const raw =
        e instanceof Error
          ? e.message
          : typeof e === "string"
            ? e
            : "";
      if (isUnhelpfulTossClientErrorMessage(raw)) {
        return t("errors.tossClientUnknown");
      }
      return raw.trim().length > 0 ? raw : t("errors.generic");
    },
    [t],
  );

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
          setError(formatThrownPaymentError(e));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clientKey, customerKey, formatThrownPaymentError]);

  async function handlePay() {
    setError(null);
    setBusy(true);
    try {
      const intent = await createTossPaymentIntent(
        TOSS_POC_AMOUNT_KRW,
        contentProductSlug ?? null,
      );
      if (!intent.ok) {
        setError(formatIntentError(intent.error));
        return;
      }
      const widgets = widgetsRef.current;
      if (!widgets) {
        setError(t("widgetNotReady"));
        return;
      }
      await widgets.setAmount({
        currency: "KRW",
        value: intent.amountKrw,
      });
      await widgets.requestPayment({
        orderId: intent.orderId,
        orderName: contentProductSlug
          ? t("orderNameWithSlug", { slug: contentProductSlug })
          : t("orderNameDefault"),
        successUrl: `${appOrigin}/dashboard/billing/success?${BILLING_RETURN_FLASH_QUERY}=success`,
        failUrl: `${appOrigin}/dashboard/billing/fail?${BILLING_RETURN_FLASH_QUERY}=fail`,
        customerEmail: customerEmail ?? undefined,
        customerName: customerName ?? t("customerFallback"),
      });
    } catch (e) {
      setError(formatThrownPaymentError(e));
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
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-text-on-color hover:bg-primary-hover disabled:opacity-50"
      >
        {busy
          ? t("widgetOpening")
          : t("widgetPay", { amount: TOSS_POC_AMOUNT_KRW })}
      </button>
      {!ready ? (
        <p className="text-xs text-text-tertiary">{t("widgetLoading")}</p>
      ) : null}
    </div>
  );
}
