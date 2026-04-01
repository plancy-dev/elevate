import Link from "next/link";
import { confirmTossPaymentFromRedirect } from "@/actions/toss-payments";
import { PurchaseSuccessCapture } from "@/components/analytics/purchase-success-capture";

export const metadata = { title: "Billing — payment success" };

export default async function BillingPaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const paymentKey = typeof sp.paymentKey === "string" ? sp.paymentKey : "";
  const orderId = typeof sp.orderId === "string" ? sp.orderId : "";
  const amount = Number(typeof sp.amount === "string" ? sp.amount : "");

  const result = await confirmTossPaymentFromRedirect({
    paymentKey,
    orderId,
    amount,
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <PurchaseSuccessCapture ok={result.ok} />
      {result.ok ? (
        <>
          <h1 className="text-lg font-medium text-text-primary">
            Payment confirmed
          </h1>
          <p className="text-sm text-text-secondary mt-2 max-w-md">
            {result.alreadyConfirmed
              ? "This payment was already confirmed."
              : "Toss accepted the test payment. Audit log records payment.intent_create and payment.confirmed."}
          </p>
        </>
      ) : (
        <>
          <h1 className="text-lg font-medium text-danger">Could not confirm</h1>
          <p className="text-sm text-text-secondary mt-2 max-w-md">{result.error}</p>
        </>
      )}
      <Link
        href="/dashboard/billing"
        className="text-sm text-primary mt-6 inline-block hover:underline"
      >
        Back to Billing
      </Link>
    </div>
  );
}
