import Link from "next/link";

type Props = {
  searchParams: Promise<{ checkout_id?: string }>;
};

export default async function SubscriptionSuccessPage({ searchParams }: Props) {
  const q = await searchParams;
  const checkoutId = typeof q.checkout_id === "string" ? q.checkout_id : null;

  return (
    <main className="border-t border-ink-100">
      <section className="elevate-marketing-shell py-16 sm:py-20">
        <div className="mx-auto max-w-2xl border border-ink-100 bg-paper-100 p-8 sm:p-10">
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-vermilion-600">
            Subscription updated
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-ink-900 sm:text-4xl">
            Payment complete
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-ink-700 sm:text-base">
            Thanks for subscribing. Your access will be reflected automatically
            once the webhook is processed.
          </p>
          {checkoutId ? (
            <p className="mt-3 font-mono text-xs text-ink-500">
              checkout_id: {checkoutId}
            </p>
          ) : null}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center border border-ink-900 bg-ink-900 px-4 py-2.5 text-sm font-medium text-paper-50 transition-colors duration-80 ease-(--ease-editorial) hover:bg-ink-700"
            >
              View pricing & status
            </Link>
            <Link
              href="/blog"
              className="inline-flex items-center justify-center border border-ink-100 bg-paper-50 px-4 py-2.5 text-sm font-medium text-ink-900 transition-colors duration-80 ease-(--ease-editorial) hover:bg-paper-0"
            >
              Go to blog
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
