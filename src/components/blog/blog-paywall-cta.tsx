import NextLink from "next/link";

type BlogPaywallCtaProps = {
  monthlyCheckoutUrl: string;
  annualCheckoutUrl: string;
};

export function BlogPaywallCta({
  monthlyCheckoutUrl,
  annualCheckoutUrl,
}: BlogPaywallCtaProps) {
  return (
    <section className="relative mt-8 border border-ink-100 bg-paper-50 p-6 sm:p-7">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-16 h-16 bg-linear-to-t from-paper-50 to-transparent"
      />
      <h2 className="text-xl font-semibold tracking-[-0.01em] text-ink-900">
        Unlock the full article
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-700">
        Join Elevate and get weekly AI tips - no technical background required.
      </p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <a
          href={monthlyCheckoutUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center border border-ink-900 bg-ink-900 px-4 py-2.5 text-sm font-medium text-paper-50 transition-colors duration-80 ease-(--ease-editorial) hover:bg-ink-700"
        >
          Subscribe Monthly - $5.99/mo
        </a>
        <a
          href={annualCheckoutUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center border border-vermilion-600 bg-vermilion-600 px-4 py-2.5 text-sm font-medium text-paper-50 transition-colors duration-80 ease-(--ease-editorial) hover:bg-vermilion-700"
        >
          Subscribe Annually - $47.99/yr (Save 33%)
        </a>
      </div>
      <div className="mt-4">
        <NextLink
          href="/login"
          className="text-sm font-medium text-vermilion-600 underline-offset-2 hover:underline"
        >
          Already a subscriber? Sign in
        </NextLink>
      </div>
    </section>
  );
}
