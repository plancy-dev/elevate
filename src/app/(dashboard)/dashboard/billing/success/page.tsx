import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { confirmTossPaymentFromRedirect } from "@/actions/toss-payments";
import { PurchaseSuccessCapture } from "@/components/analytics/purchase-success-capture";
import { BillingReturnFlashToast } from "@/components/dashboard/billing-return-flash-toast";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Dashboard.billing");
  return { title: t("successMeta") };
}

export default async function BillingPaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const paymentKey = typeof sp.paymentKey === "string" ? sp.paymentKey : "";
  const orderId = typeof sp.orderId === "string" ? sp.orderId : "";
  const amountRaw = typeof sp.amount === "string" ? sp.amount : "";
  const hasTossReturnParams =
    paymentKey.length > 0 && orderId.length > 0 && amountRaw.length > 0;
  const amount = Number(amountRaw);

  const t = await getTranslations("Dashboard.billing");

  /** Lemon / legacy redirects hit this URL without Toss query params. */
  if (!hasTossReturnParams || !Number.isFinite(amount)) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Suspense fallback={null}>
          <BillingReturnFlashToast />
        </Suspense>
        <h1 className="text-lg font-medium text-text-primary">
          {t("externalCheckoutReturnTitle")}
        </h1>
        <p className="text-sm text-text-secondary mt-2 max-w-md leading-relaxed">
          {t("externalCheckoutReturnBody")}
        </p>
        <Link
          href="/dashboard/library"
          className="text-sm text-primary mt-6 inline-block hover:underline"
        >
          {t("externalCheckoutReturnLibrary")}
        </Link>
        <p className="mt-4">
          <Link
            href="/dashboard/billing"
            className="text-sm text-text-tertiary hover:text-primary hover:underline"
          >
            {t("backToBilling")}
          </Link>
        </p>
      </div>
    );
  }

  const result = await confirmTossPaymentFromRedirect({
    paymentKey,
    orderId,
    amount,
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <Suspense fallback={null}>
        <BillingReturnFlashToast />
      </Suspense>
      <PurchaseSuccessCapture ok={result.ok} />
      {result.ok ? (
        <>
          <h1 className="text-lg font-medium text-text-primary">
            {t("successTitle")}
          </h1>
          <p className="text-sm text-text-secondary mt-2 max-w-md">
            {result.alreadyConfirmed ? t("successAlready") : t("successBody")}
          </p>
        </>
      ) : (
        <>
          <h1 className="text-lg font-medium text-danger">
            {t("failConfirmTitle")}
          </h1>
          <p className="text-sm text-text-secondary mt-2 max-w-md">
            {"errorKey" in result && result.errorKey
              ? t(`confirmErrors.${result.errorKey}`)
              : result.error}
          </p>
        </>
      )}
      <Link
        href="/dashboard/billing"
        className="text-sm text-primary mt-6 inline-block hover:underline"
      >
        {t("backToBilling")}
      </Link>
    </div>
  );
}
