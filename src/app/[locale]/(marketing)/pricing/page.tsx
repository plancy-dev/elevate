import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import NextLink from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  buildBlogSubscriptionCheckoutUrl,
  getBlogSubscriptionByUserId,
  POLAR_ANNUAL_PRODUCT_ID,
  POLAR_MONTHLY_PRODUCT_ID,
} from "@/lib/subscriptions/blog-subscription";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const tMeta = await getTranslations({ locale, namespace: "Metadata" });
  return { title: tMeta("pageTitles.pricing") };
}

export default async function PricingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const subscription = await getBlogSubscriptionByUserId(supabase, user?.id ?? null);

  const monthlyCheckoutUrl = buildBlogSubscriptionCheckoutUrl({
    productId: POLAR_MONTHLY_PRODUCT_ID,
    email: user?.email,
  });
  const annualCheckoutUrl = buildBlogSubscriptionCheckoutUrl({
    productId: POLAR_ANNUAL_PRODUCT_ID,
    email: user?.email,
  });

  const showManageLink = Boolean(subscription.manageSubscriptionUrl);
  const showActiveState =
    subscription.status === "active" &&
    (subscription.tier === "monthly" || subscription.tier === "annual");

  return (
    <div className="border-t border-ink-100">
      <section className="elevate-marketing-shell py-14 text-center sm:py-16">
        <h1 className="text-[length:var(--elevate-marketing-home-hero-size)] font-semibold leading-[1.1] tracking-[-0.02em] text-ink-900">
          Choose your plan
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[length:var(--elevate-marketing-lead-size)] leading-[var(--elevate-prose-body-leading)] text-ink-700">
          Weekly practical AI tips for everyday users, from quick previews to full archive access.
        </p>
      </section>

      <section className="elevate-marketing-shell pb-14 sm:pb-16">
        <div className="grid gap-px overflow-hidden border border-ink-100 bg-ink-100 md:grid-cols-3">
          <article className="bg-paper-100 p-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">Free</p>
            <h2 className="mt-2 text-[length:var(--elevate-marketing-lead-size)] font-semibold text-ink-900">
              $0
            </h2>
            <p className="mt-3 text-[length:var(--elevate-prose-body-size)] leading-[var(--elevate-prose-body-leading)] text-ink-700">
              Preview access and saved reading list.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-ink-700">
              <li>- Read the first 30-40% of premium posts</li>
              <li>- Save bookmarks and reading history</li>
            </ul>
            <div className="mt-6">
              <NextLink
                href="/signup"
                className="inline-flex items-center justify-center border border-ink-100 bg-paper-50 px-4 py-2.5 text-sm font-medium text-ink-900 transition-colors duration-80 ease-(--ease-editorial) hover:bg-paper-0"
              >
                Create free account
              </NextLink>
            </div>
          </article>

          <article className="bg-paper-100 p-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">Monthly</p>
            <h2 className="mt-2 text-[length:var(--elevate-marketing-lead-size)] font-semibold text-ink-900">
              $5.99 / month
            </h2>
            <p className="mt-3 text-[length:var(--elevate-prose-body-size)] leading-[var(--elevate-prose-body-leading)] text-ink-700">
              Full access to all posts and the full archive.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-ink-700">
              <li>- Unlimited access to premium articles</li>
              <li>- Full archive access</li>
            </ul>
            <div className="mt-6">
              <a
                href={monthlyCheckoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center border border-ink-900 bg-ink-900 px-4 py-2.5 text-sm font-medium text-paper-50 transition-colors duration-80 ease-(--ease-editorial) hover:bg-ink-700"
              >
                Subscribe Monthly - $5.99/mo
              </a>
            </div>
          </article>

          <article className="border-t-2 border-t-vermilion-600 bg-vermilion-50 p-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-vermilion-600">
              Annual
            </p>
            <h2 className="mt-2 text-[length:var(--elevate-marketing-lead-size)] font-semibold text-ink-900">
              $47.99 / year
            </h2>
            <p className="mt-3 text-[length:var(--elevate-prose-body-size)] leading-[var(--elevate-prose-body-leading)] text-ink-700">
              Full access plus the best value for long-term readers.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-ink-700">
              <li>- Unlimited access to premium articles</li>
              <li>- Full archive access</li>
              <li>- Save 33% compared to monthly billing</li>
            </ul>
            <div className="mt-6">
              <a
                href={annualCheckoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center border border-vermilion-600 bg-vermilion-600 px-4 py-2.5 text-sm font-medium text-paper-50 transition-colors duration-80 ease-(--ease-editorial) hover:bg-vermilion-700"
              >
                Subscribe Annually - $47.99/yr (Save 33%)
              </a>
            </div>
          </article>
        </div>
      </section>

      <section className="elevate-marketing-shell pb-16 sm:pb-20">
        <h2 className="mb-6 text-center text-[length:var(--elevate-marketing-section-title-size)] font-semibold tracking-[-0.02em] text-ink-900">
          Subscription status
        </h2>
        <div className="mx-auto max-w-xl border border-ink-100 bg-paper-100 p-6">
          {showActiveState ? (
            <>
              <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-vermilion-600">
                Active plan
              </p>
              <p className="mt-2 text-lg font-semibold text-ink-900">
                {subscription.tier === "annual" ? "Annual Subscriber" : "Monthly Subscriber"}
              </p>
              <p className="mt-2 text-sm text-ink-700">
                Status: {subscription.status}
                {subscription.currentPeriodEnd
                  ? ` · Current period ends ${new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US")}`
                  : ""}
              </p>
              {showManageLink ? (
                <a
                  href={subscription.manageSubscriptionUrl ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex text-sm font-medium text-vermilion-600 underline-offset-2 hover:underline"
                >
                  Manage Subscription
                </a>
              ) : null}
            </>
          ) : (
            <>
              <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500">
                Current plan
              </p>
              <p className="mt-2 text-lg font-semibold text-ink-900">Free</p>
              <p className="mt-2 text-sm text-ink-700">
                Upgrade to monthly or annual for full access to all posts and archive.
              </p>
              {!user ? (
                <NextLink
                  href="/login"
                  className="mt-4 inline-flex text-sm font-medium text-vermilion-600 underline-offset-2 hover:underline"
                >
                  Sign in to continue
                </NextLink>
              ) : null}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
