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
import { Card, CardContent } from "@/components/ui/card";
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
    <div className="p-6 lg:p-8 max-w-4xl">
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
        <Card
          className="mb-8 max-w-2xl border-dashed bg-layer-02/80 shadow-ambient"
          role="note"
        >
          <CardContent className="p-4">
            <p className="text-sm leading-relaxed text-text-secondary">
              {t("subscriptionBanner")}
            </p>
            <Link
              href="/dashboard/billing"
              className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
            >
              {t("subscriptionBillingCta")}
            </Link>
          </CardContent>
        </Card>
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
        <ul className="space-y-4">
          {products.map((p) => {
            const canRead = canReadCatalogProduct({
              organizationPlan,
              entitledProductIds: entitledIds,
              productId: p.id,
            });
            const kindLabel = t(productKindMessageKey(p.product_kind));
            return (
              <li key={p.id}>
                <Card className="border-border-subtle">
                  <CardContent className="p-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="blue">{kindLabel}</Badge>
                        <h2 className="text-base font-semibold text-text-primary">
                          {p.title}
                        </h2>
                        <Badge variant={canRead ? "green" : "warm-gray"}>
                          {canRead ? t("included") : t("notIncluded")}
                        </Badge>
                      </div>
                      {p.description ? (
                        <p className="mt-2 text-sm text-text-tertiary leading-relaxed">
                          {p.description}
                        </p>
                      ) : null}
                      <p className="mt-2 text-xs text-text-tertiary font-mono">
                        {p.slug}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 text-right">
                      <span className="text-sm font-medium text-text-primary whitespace-nowrap">
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
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
