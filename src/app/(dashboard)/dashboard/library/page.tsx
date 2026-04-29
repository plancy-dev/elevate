import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import type { ContentProductKind } from "@/lib/data/library";
import { getLibraryPageData } from "@/lib/data/library";
import { canReadCatalogProduct } from "@/lib/content/ebook-access";
import { hasPaidServiceSubscription } from "@/lib/organizations/plan";
import { FunnelCaptureOnce } from "@/components/analytics/funnel-capture";
import { LibraryPdfDownloadActions } from "@/components/dashboard/library-download-button";
import { LibraryReadOnlineButton } from "@/components/dashboard/library-read-online-button";
import { Badge } from "@/components/ui/badge";
import { PostHogEvent } from "@/lib/analytics/posthog-events";
import { formatCurrencyMinor } from "@/lib/format-currency";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Dashboard.library");
  return { title: t("metaTitle") };
}

function productKindMessageKey(
  kind: ContentProductKind,
): "productKind.ebook" | "productKind.guide" | "productKind.template" | "productKind.bundle" {
  return `productKind.${kind}`;
}

export default async function LibraryPage() {
  const t = await getTranslations("Dashboard.library");
  const tBilling = await getTranslations("Dashboard.billing");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  const orgId = profile?.organization_id ?? null;
  const { products, entitledIds, organizationPlan } =
    await getLibraryPageData(supabase, orgId);

  const subscribed = hasPaidServiceSubscription(organizationPlan);
  const showStarterSubscription =
    orgId !== null && organizationPlan !== null && !subscribed;

  return (
    <div className="mx-auto w-full max-w-4xl p-6 lg:p-8">
      <FunnelCaptureOnce event={PostHogEvent.ELEVATE_FUNNEL_LIBRARY_VIEW} />
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-ink-900 tracking-tight">
            {t("metaTitle")}
          </h1>
          <p className="mt-2 text-sm text-ink-500 leading-relaxed max-w-2xl">
            {t("subtitle")}
          </p>
        </div>
        <Link
          href="/dashboard/billing/purchases"
          className="shrink-0 text-sm font-medium text-primary hover:underline sm:pt-1"
        >
          {tBilling("linkPurchaseHistory")}
        </Link>
      </div>

      {showStarterSubscription ? (
        <div
          className="mb-8 max-w-2xl rounded-[var(--radius-1)] border border-dashed border-ink-100 bg-paper-50/80 p-4"
          role="note"
        >
          <p className="text-sm leading-relaxed text-ink-700">
            {t("subscriptionBanner")}
          </p>
          <Link
            href="/dashboard/billing"
            className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
          >
            {t("subscriptionBillingCta")}
          </Link>
        </div>
      ) : null}

      {products.length === 0 ? (
        <div className="space-y-3 max-w-2xl">
          <p className="text-sm text-ink-700">{t("empty")}</p>
          {showStarterSubscription ? (
            <p className="text-sm text-ink-500 leading-relaxed">
              {t("emptyStarterNote")}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-1)] border border-ink-100 bg-paper-0">
          <ul className="divide-y divide-border-subtle">
            {products.map((p) => {
              const canRead = canReadCatalogProduct({
                organizationPlan,
                entitledProductIds: entitledIds,
                productId: p.id,
              });
              const kindLabel = t(productKindMessageKey(p.product_kind));
              return (
                <li key={p.id}>
                  <div className="grid gap-4 px-5 py-4 transition-colors duration-150 hover:bg-paper-50 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-6">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="blue" className="shrink-0">
                          {kindLabel}
                        </Badge>
                        <h2 className="text-base font-semibold text-ink-900">
                          <Link
                            href={`/dashboard/library/${encodeURIComponent(p.slug)}`}
                            className="hover:text-primary hover:underline"
                          >
                            {p.title}
                          </Link>
                        </h2>
                        <Badge
                          variant={canRead ? "green" : "warm-gray"}
                          className="shrink-0"
                        >
                          {canRead ? t("included") : t("notIncluded")}
                        </Badge>
                      </div>
                      {p.description ? (
                        <p className="mt-2 text-sm leading-relaxed text-ink-500">
                          {p.description}
                        </p>
                      ) : null}
                      <p className="mt-2 font-mono text-xs text-ink-500">
                        {p.slug}
                      </p>
                    </div>
                    <div className="flex flex-col items-start gap-2 sm:min-w-[8.75rem] sm:items-end sm:text-right">
                      <span className="text-sm font-medium whitespace-nowrap text-ink-900">
                        {formatCurrencyMinor(p.price_cents, p.currency)}
                      </span>
                      {!canRead ? (
                        <Link
                          href={`/dashboard/library/${encodeURIComponent(p.slug)}/checkout`}
                          prefetch={false}
                          className="text-sm font-medium whitespace-nowrap text-primary hover:underline"
                        >
                          {t("payCatalog")}
                        </Link>
                      ) : null}
                      {canRead &&
                      p.delivery_mode === "pdf" &&
                      p.storage_object_path ? (
                        <LibraryPdfDownloadActions productId={p.id} />
                      ) : null}
                      {canRead && p.delivery_mode === "web_only" ? (
                        <LibraryReadOnlineButton
                          productId={p.id}
                          slug={p.slug}
                        >
                          {t("readOnline")}
                        </LibraryReadOnlineButton>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
