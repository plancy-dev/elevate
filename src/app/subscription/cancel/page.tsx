import Link from "next/link";

export default function SubscriptionCancelPage() {
  return (
    <main className="border-t border-ink-100">
      <section className="elevate-marketing-shell py-16 sm:py-20">
        <div className="mx-auto max-w-2xl border border-ink-100 bg-paper-100 p-8 sm:p-10">
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
            Checkout not completed
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-ink-900 sm:text-4xl">
            No problem, you can continue anytime
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-ink-700 sm:text-base">
            You can return to pricing and complete checkout whenever you are
            ready.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center border border-ink-900 bg-ink-900 px-4 py-2.5 text-sm font-medium text-paper-50 transition-colors duration-80 ease-(--ease-editorial) hover:bg-ink-700"
            >
              Back to pricing
            </Link>
            <Link
              href="/blog"
              className="inline-flex items-center justify-center border border-ink-100 bg-paper-50 px-4 py-2.5 text-sm font-medium text-ink-900 transition-colors duration-80 ease-(--ease-editorial) hover:bg-paper-0"
            >
              Read free posts
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
