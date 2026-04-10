"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

export type LemonBillingUnconfiguredReason =
  | "not_linked"
  | "api_not_configured"
  | "checkout_api_failed"
  | "unknown_product";

type Props = {
  contentProductSlug: string | null;
  checkoutUrl: string | null;
  organizationId: string | null;
  profileEmail: string | null;
  /** When true, custom_data is embedded in the checkout session (API-generated URL). */
  embedsCustomDataInCheckout: boolean;
  unconfiguredReason?: LemonBillingUnconfiguredReason | null;
};

function CopyButton({ text, label }: { text: string; label: string }) {
  const t = useTranslations("Dashboard.billing");
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      className="rounded-md border border-border-subtle bg-layer-01 px-2 py-1 text-xs text-text-secondary hover:bg-layer-02 hover:text-text-primary transition-colors"
    >
      {copied ? t("lemonCopied") : label}
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
}: Props) {
  const t = useTranslations("Dashboard.billing");

  const customDataJson = useMemo(() => {
    if (!contentProductSlug) {
      return "";
    }
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
    Boolean(organizationId && customDataJson) && !embedsCustomDataInCheckout;

  if (!contentProductSlug) {
    return (
      <p className="text-sm text-text-secondary leading-relaxed">{t("lemonPickFromLibrary")}</p>
    );
  }

  if (!checkoutUrl) {
    const titleKey =
      unconfiguredReason === "api_not_configured"
        ? "lemonMissingApiTitle"
        : unconfiguredReason === "checkout_api_failed"
          ? "lemonCheckoutFailedTitle"
          : unconfiguredReason === "unknown_product"
            ? "lemonUnknownProductTitle"
            : "lemonMissingUrlTitle";
    const bodyKey =
      unconfiguredReason === "api_not_configured"
        ? "lemonMissingApiBody"
        : unconfiguredReason === "checkout_api_failed"
          ? "lemonCheckoutFailedBody"
          : unconfiguredReason === "unknown_product"
            ? "lemonUnknownProductBody"
            : "lemonMissingUrlBody";

    return (
      <div className="space-y-4">
        <div
          className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-text-secondary"
          role="alert"
        >
          <p className="font-medium text-text-primary">{t(titleKey)}</p>
          <p className="mt-2 leading-relaxed">{t(bodyKey)}</p>
        </div>
        {showManualCustomData ? (
          <div className="rounded-lg border border-border-subtle bg-layer-02 p-3">
            <p className="text-xs font-medium text-text-tertiary mb-2">{t("lemonCustomDataLabel")}</p>
            <pre className="text-[11px] leading-snug text-text-secondary whitespace-pre-wrap break-all mb-2 font-mono">
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
      <p className="text-sm text-text-secondary leading-relaxed">
        {t("lemonCheckoutWithSlug", { slug: contentProductSlug })}
      </p>
      {profileEmail ? (
        <p className="text-xs text-text-tertiary leading-relaxed">
          {t("lemonEmailCurrent", { email: profileEmail })}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <a
          href={checkoutUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-ambient transition-opacity hover:opacity-90"
        >
          {t("lemonOpenCheckout")}
        </a>
      </div>
      <p className="text-xs text-text-tertiary leading-relaxed">{t("lemonEmailHint")}</p>
      {embedsCustomDataInCheckout ? (
        <p className="text-xs text-text-secondary border border-border-subtle rounded-lg bg-layer-02 px-3 py-2 leading-relaxed">
          {t("lemonEmbeddedCheckoutNote")}
        </p>
      ) : null}
      {showManualCustomData ? (
        <div className="rounded-lg border border-border-subtle bg-layer-02 p-3">
          <p className="text-xs font-medium text-text-tertiary mb-2">{t("lemonCustomDataLabel")}</p>
          <pre className="text-[11px] leading-snug text-text-secondary whitespace-pre-wrap break-all mb-2 font-mono">
            {customDataJson}
          </pre>
          <CopyButton text={customDataJson} label={t("lemonCopyCustomData")} />
        </div>
      ) : null}
      <p className="text-sm text-text-tertiary border-t border-border-subtle pt-4 leading-relaxed">
        {t("lemonAfterPay")}
      </p>
    </div>
  );
}
