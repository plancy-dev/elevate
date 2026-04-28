"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { LEMON_CUSTOM_PRICE_MIN_KRW } from "@/lib/payments/lemon-custom-price-minimum";
import { toast } from "@/lib/ui/app-toast";

export type LemonBillingUnconfiguredReason =
  | "not_linked"
  | "api_not_configured"
  | "checkout_api_failed"
  | "price_below_lemon_minimum"
  | "unknown_product";

type Props = {
  contentProductSlug: string;
  checkoutUrl: string | null;
  organizationId: string | null;
  profileEmail: string | null;
  /** When true, custom_data is embedded in the checkout session (API-generated URL). */
  embedsCustomDataInCheckout: boolean;
  unconfiguredReason?: LemonBillingUnconfiguredReason | null;
  /** JSON / manual paste panels for Lemon integration (admin tooling). Hidden for end users. */
  showManualIntegrationPanel?: boolean;
};

function CopyButton({ text, label }: { text: string; label: string }) {
  const t = useTranslations("Dashboard.billing");

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("lemonCopied"));
    } catch {
      // clipboard may be unavailable; avoid noisy toasts
    }
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      className="rounded-[var(--radius-1)] border border-ink-100 bg-paper-0 px-2 py-1 text-xs text-ink-700 hover:bg-paper-50 hover:text-ink-900 transition-colors"
    >
      {label}
    </button>
  );
}

export function BillingLemonCheckout({
  contentProductSlug,
  checkoutUrl,
  organizationId,
  profileEmail,
  embedsCustomDataInCheckout,
  unconfiguredReason,
  showManualIntegrationPanel = false,
}: Props) {
  const t = useTranslations("Dashboard.billing");

  const customDataJson = useMemo(() => {
    if (organizationId) {
      return JSON.stringify(
        {
          organization_id: organizationId,
          content_product_slug: contentProductSlug,
        },
        null,
        2,
      );
    }
    return JSON.stringify({ content_product_slug: contentProductSlug }, null, 2);
  }, [contentProductSlug, organizationId]);

  const showManualCustomData =
    showManualIntegrationPanel &&
    Boolean(organizationId && customDataJson) &&
    !embedsCustomDataInCheckout;

  if (!checkoutUrl) {
    const titleKey =
      unconfiguredReason === "api_not_configured"
        ? "lemonMissingApiTitle"
        : unconfiguredReason === "checkout_api_failed"
          ? "lemonCheckoutFailedTitle"
          : unconfiguredReason === "price_below_lemon_minimum"
            ? "lemonPriceBelowMinimumTitle"
            : unconfiguredReason === "unknown_product"
              ? "lemonUnknownProductTitle"
              : "lemonMissingUrlTitle";
    const bodyKey =
      unconfiguredReason === "api_not_configured"
        ? "lemonMissingApiBody"
        : unconfiguredReason === "checkout_api_failed"
          ? "lemonCheckoutFailedBody"
          : unconfiguredReason === "price_below_lemon_minimum"
            ? "lemonPriceBelowMinimumBody"
            : unconfiguredReason === "unknown_product"
              ? "lemonUnknownProductBody"
              : "lemonMissingUrlBody";

    return (
      <div className="space-y-4">
        <div
          className="rounded-[var(--radius-1)] border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-ink-700"
          role="alert"
        >
          <p className="font-medium text-ink-900">{t(titleKey)}</p>
          <p className="mt-2 leading-relaxed">
            {unconfiguredReason === "price_below_lemon_minimum"
              ? t("lemonPriceBelowMinimumBody", { minKrw: LEMON_CUSTOM_PRICE_MIN_KRW })
              : t(bodyKey)}
          </p>
        </div>
        {showManualCustomData ? (
          <div className="rounded-[var(--radius-1)] border border-ink-100 bg-paper-50 p-3">
            <p className="text-xs font-medium text-ink-500 mb-2">{t("lemonCustomDataLabel")}</p>
            <pre className="text-[11px] leading-snug text-ink-700 whitespace-pre-wrap break-all mb-2 font-mono">
              {customDataJson}
            </pre>
            <CopyButton text={customDataJson} label={t("lemonCopyCustomData")} />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-ink-700 leading-relaxed">
        {t("lemonCheckoutWithSlug", { slug: contentProductSlug })}
      </p>
      {profileEmail ? (
        <p className="text-xs text-ink-500 leading-relaxed">
          {t("lemonEmailCurrent", { email: profileEmail })}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <a
          href={checkoutUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-[var(--radius-1)] bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          {t("lemonOpenCheckout")}
        </a>
      </div>
      <p className="text-xs text-ink-500 leading-relaxed">{t("lemonEmailHint")}</p>
      {embedsCustomDataInCheckout ? (
        <p className="text-xs text-ink-700 border border-ink-100 rounded-[var(--radius-1)] bg-paper-50 px-3 py-2 leading-relaxed">
          {t("lemonEmbeddedCheckoutNote")}
        </p>
      ) : null}
      {showManualCustomData ? (
        <div className="rounded-[var(--radius-1)] border border-ink-100 bg-paper-50 p-3">
          <p className="text-xs font-medium text-ink-500 mb-2">{t("lemonCustomDataLabel")}</p>
          <pre className="text-[11px] leading-snug text-ink-700 whitespace-pre-wrap break-all mb-2 font-mono">
            {customDataJson}
          </pre>
          <CopyButton text={customDataJson} label={t("lemonCopyCustomData")} />
        </div>
      ) : null}
      <p className="text-sm text-ink-500 border-t border-ink-100 pt-4 leading-relaxed">
        {t("lemonAfterPay")}
      </p>
    </div>
  );
}
