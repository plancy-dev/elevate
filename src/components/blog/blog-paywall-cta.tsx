import NextLink from "next/link";

type BlogPaywallCtaProps =
  | {
      mode: "premium";
      monthlyCheckoutUrl: string;
      annualCheckoutUrl: string;
      isAuthenticated: boolean;
    }
  | {
      mode: "member";
      isAuthenticated: boolean;
    };

export function BlogPaywallCta(props: BlogPaywallCtaProps) {
  const isMemberGate = props.mode === "member";
  const premiumCtaLinks =
    props.mode === "premium" ? (
      <>
        <a
          href={props.monthlyCheckoutUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-12 w-full min-w-0 items-center justify-center border border-ink-900 bg-ink-900 px-4 py-2.5 text-center text-[13px] leading-snug font-medium whitespace-normal text-paper-50 transition-colors duration-80 ease-(--ease-editorial) hover:bg-ink-700 sm:text-sm"
        >
          <span className="sm:hidden">Monthly - $5.99/mo</span>
          <span className="hidden sm:inline">Subscribe Monthly - $5.99/mo</span>
        </a>
        <a
          href={props.annualCheckoutUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-12 w-full min-w-0 items-center justify-center border border-vermilion-600 bg-vermilion-600 px-4 py-2.5 text-center text-[13px] leading-snug font-medium whitespace-normal text-paper-50 transition-colors duration-80 ease-(--ease-editorial) hover:bg-vermilion-700 sm:text-sm"
        >
          <span className="sm:hidden">Annual - $47.99/yr</span>
          <span className="hidden sm:inline xl:hidden">Subscribe Annually - $47.99/yr</span>
          <span className="hidden xl:inline">Subscribe Annually - $47.99/yr (Save 33%)</span>
        </a>
      </>
    ) : null;
  return (
    <section className="relative z-10 mt-8 border border-ink-100 bg-paper-50 p-6 sm:p-7">
      <h2 className="text-xl font-semibold tracking-[-0.01em] text-ink-900">
        {isMemberGate
          ? "Create a free account to continue reading"
          : "Unlock the full article"}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-700">
        {isMemberGate
          ? "Free members can read member-only posts, save reading history, and bookmark articles."
          : "Join Elevate and get weekly AI tips - no technical background required."}
      </p>
      <div
        className={
          isMemberGate ? "mt-5 flex flex-col gap-3" : "mt-5 grid grid-cols-1 gap-2.5 sm:gap-3 lg:grid-cols-2"
        }
      >
        {isMemberGate ? (
          <NextLink
            href="/signup"
            className="inline-flex w-full items-center justify-center border border-ink-900 bg-ink-900 px-4 py-2.5 text-sm font-medium text-paper-50 transition-colors duration-80 ease-(--ease-editorial) hover:bg-ink-700"
          >
            Create free account
          </NextLink>
        ) : (
          premiumCtaLinks
        )}
      </div>
      <div className="mt-4">
        {props.isAuthenticated ? (
          <NextLink
            href="/pricing"
            className="text-sm font-medium text-vermilion-600 underline-offset-2 hover:underline"
          >
            View pricing and subscription status
          </NextLink>
        ) : (
          <NextLink
            href="/login"
            className="text-sm font-medium text-vermilion-600 underline-offset-2 hover:underline"
          >
            {isMemberGate ? "Already have an account? Sign in" : "Already a subscriber? Sign in"}
          </NextLink>
        )}
      </div>
    </section>
  );
}
