import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import type { ContentProductKind } from "@/lib/data/library";
import { getLibraryPageData } from "@/lib/data/library";
import { canReadCatalogProduct } from "@/lib/content/ebook-access";
import { hasPaidServiceSubscription } from "@/lib/organizations/plan";
import { FunnelCaptureOnce } from "@/components/analytics/funnel-capture";
import { LibraryDownloadButton } from "@/components/dashboard/library-download-button";
import { LibraryReadOnlineButton } from "@/components/dashboard/library-read-online-button";
import { Badge } from "@/components/ui/badge";
import { PostHogEvent } from "@/lib/analytics/posthog-events";
import { formatCurrencyMinor } from "@/lib/format-currency";
import { TOSS_POC_AMOUNT_KRW } from "@/lib/payments/toss-poc";

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
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
          {t("metaTitle")}
        </h1>
        <p className="mt-2 text-sm text-text-tertiary leading-relaxed max-w-2xl">
          {t("subtitle")}
        </p>
      </div>

      {showStarterSubscription ? (
        <div
          className="mb-8 max-w-2xl rounded-xl border border-dashed border-border-subtle bg-layer-02/80 p-4 shadow-ambient"
          role="note"
        >
          <p className="text-sm leading-relaxed text-text-secondary">
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
          <p className="text-sm text-text-secondary">{t("empty")}</p>
          {showStarterSubscription ? (
            <p className="text-sm text-text-tertiary leading-relaxed">
              {t("emptyStarterNote")}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border-subtle bg-layer-01 shadow-card">
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
                  <div className="flex flex-col gap-4 px-5 py-4 transition-colors duration-150 hover:bg-layer-02 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="blue" className="shrink-0">
                          {kindLabel}
                        </Badge>
                        <h2 className="text-base font-semibold text-text-primary">
                          {p.title}
                        </h2>
                        <Badge
                          variant={canRead ? "green" : "warm-gray"}
                          className="shrink-0"
                        >
                          {canRead ? t("included") : t("notIncluded")}
                        </Badge>
                      </div>
                      {p.description ? (
                        <p className="mt-2 text-sm leading-relaxed text-text-tertiary">
                          {p.description}
                        </p>
                      ) : null}
                      <p className="mt-2 font-mono text-xs text-text-tertiary">
                        {p.slug}
                      </p>
                    </div>
                    <div className="flex flex-col items-stretch gap-2 text-right sm:items-end">
                      <span className="text-sm font-medium whitespace-nowrap text-text-primary">
                        {formatCurrencyMinor(p.price_cents, p.currency)}
                      </span>
                      {!canRead ? (
                        <Link
                          href={`/dashboard/billing?product=${encodeURIComponent(p.slug)}`}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          {t("payPoc", { amount: TOSS_POC_AMOUNT_KRW })}
                        </Link>
                      ) : null}
                      {canRead &&
                      p.delivery_mode === "pdf" &&
                      p.storage_object_path ? (
                        <LibraryDownloadButton productId={p.id}>
                          {t("download")}
                        </LibraryDownloadButton>
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
