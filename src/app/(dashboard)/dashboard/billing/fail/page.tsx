import Link from "next/link";

export const metadata = { title: "Billing — payment failed" };

export default async function BillingPaymentFailPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const code = typeof sp.code === "string" ? sp.code : "";
  const message = typeof sp.message === "string" ? sp.message : "";

  return (
    <div className="min-h-screen bg-background p-6">
      <h1 className="text-lg font-medium text-text-primary">Payment cancelled or failed</h1>
      <p className="text-sm text-text-secondary mt-2 max-w-md">
        {message || "The test payment did not complete. You can try again from Billing."}
      </p>
      {code ? (
        <p className="text-xs text-text-tertiary mt-2 font-mono">Code: {code}</p>
      ) : null}
      <Link
        href="/dashboard/billing"
        className="text-sm text-primary mt-6 inline-block hover:underline"
      >
        Back to Billing
      </Link>
    </div>
  );
}
