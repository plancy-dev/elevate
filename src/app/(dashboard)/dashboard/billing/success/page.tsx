import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { BillingReturnFlashToast } from "@/components/dashboard/billing-return-flash-toast";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Dashboard.billing");
  return { title: t("successMeta") };
}

/**
 * Return URL after hosted checkout (Lemon Squeezy, Polar, etc.).
 * Payment confirmation is handled by provider webhooks; this page is UX only.
 */
export default async function BillingPaymentSuccessPage() {
  const t = await getTranslations("Dashboard.billing");

  return (
    <div className="min-h-screen bg-paper-50 p-6">
      <Suspense fallback={null}>
        <BillingReturnFlashToast />
      </Suspense>
      <h1 className="text-lg font-medium text-ink-900">
        {t("externalCheckoutReturnTitle")}
      </h1>
      <p className="text-sm text-ink-700 mt-2 max-w-md leading-relaxed">
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
          className="text-sm text-ink-500 hover:text-vermilion-700 hover:underline"
        >
          {t("backToBilling")}
        </Link>
      </p>
    </div>
  );
}
