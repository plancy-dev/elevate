import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { isValidCatalogSlug } from "@/lib/content/catalog-slug";
import { canReadCatalogProduct } from "@/lib/content/ebook-access";
import {
  getLibraryProductBySlug,
  type ContentProductKind,
} from "@/lib/data/library";
import { hasPaidServiceSubscription } from "@/lib/organizations/plan";
import { LibraryPdfDownloadActions } from "@/components/dashboard/library-download-button";
import { LibraryReadOnlineButton } from "@/components/dashboard/library-read-online-button";
import { Badge } from "@/components/ui/badge";
import { formatCurrencyMinor } from "@/lib/format-currency";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ checkout?: string; reason?: string }>;
};

function productKindMessageKey(
  kind: ContentProductKind,
): "productKind.ebook" | "productKind.guide" | "productKind.template" | "productKind.bundle" {
  return `productKind.${kind}`;
}

function outlineCandidateLines(description: string): string[] {
  const lines = description
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const bullets = lines.filter(
    (l) =>
      /^[-•*]\s+/.test(l) ||
      /^\d+[.)]\s+/.test(l) ||
      /^[ivxlcdm]+[.)]\s+/i.test(l),
  );
  return bullets.length >= 2 ? bullets : [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!isValidCatalogSlug(slug)) {
    return { title: "Library" };
  }
  const supabase = await createClient();
  const { data: product } = await supabase
    .from("content_products")
    .select("title")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  const t = await getTranslations("Dashboard.library");
  if (!product?.title) {
    return { title: t("metaTitle") };
  }
  return { title: t("detailMetaTitle", { title: product.title }) };
}

export default async function LibraryCatalogDetailPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  if (!isValidCatalogSlug(slug)) {
    notFound();
  }

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
  const { product, entitledIds, organizationPlan } = await getLibraryProductBySlug(
    supabase,
    orgId,
    slug,
  );

  if (!product) {
    notFound();
  }

  const canRead = canReadCatalogProduct({
    organizationPlan,
    entitledProductIds: entitledIds,
    productId: product.id,
  });

  const subscribed = hasPaidServiceSubscription(organizationPlan);
  const showStarterSubscription =
    orgId !== null && organizationPlan !== null && !subscribed;

  const kindLabel = t(productKindMessageKey(product.product_kind));
  const checkoutState = sp.checkout;
  const checkoutSuccess = checkoutState === "success";
  const pendingUnlockAfterCheckout = checkoutSuccess && !canRead;
  const failReason = typeof sp.reason === "string" ? sp.reason : "";

  const outlineLines = outlineCandidateLines(product.description);

  return (
    <div className="mx-auto w-full max-w-3xl p-6 lg:p-8">
      <nav className="mb-6">
        <Link
          href="/dashboard/library"
          className="text-sm font-medium text-primary hover:underline"
        >
          {t("detailBack")}
        </Link>
      </nav>

      {checkoutSuccess ? (
        <div
          className="mb-6 rounded-[var(--radius-1)] border border-emerald-500/35 bg-emerald-500/10 px-4 py-3 text-sm text-ink-700"
          role="status"
        >
          <p className="font-medium text-ink-900">{t("detailCheckoutSuccessTitle")}</p>
          <p className="mt-1 leading-relaxed">
            {canRead ? t("detailCheckoutSuccessUnlockedBody") : t("detailCheckoutSuccessPendingBody")}
          </p>
          {!canRead ? (
            <Link
              href="/dashboard/library"
              className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
            >
              {t("detailRefreshLibrary")}
            </Link>
          ) : null}
        </div>
      ) : null}

      {checkoutState === "error" ? (
        <div
          className="mb-6 rounded-[var(--radius-1)] border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-ink-700"
          role="alert"
        >
          <p className="font-medium text-ink-900">{t("detailCheckoutErrorTitle")}</p>
          <p className="mt-1 leading-relaxed">
            {failReason === "not_linked" || failReason === "no_slug"
              ? t("checkoutErrorNotLinked")
              : failReason === "api_not_configured"
                ? t("checkoutErrorApiNotConfigured")
                : failReason === "checkout_api_failed"
                  ? t("checkoutErrorCheckoutFailed")
                  : failReason === "price_below_lemon_minimum"
                    ? t("checkoutErrorPriceLow")
                    : failReason === "unknown_product"
                      ? t("checkoutErrorUnknownProduct")
                      : t("checkoutErrorGeneric")}
          </p>
          <Link
            href={`/dashboard/billing?product=${encodeURIComponent(slug)}`}
            className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
          >
            {t("detailBillingFallback")}
          </Link>
        </div>
      ) : null}

      {showStarterSubscription ? (
        <div
          className="mb-8 rounded-[var(--radius-1)] border border-dashed border-ink-100 bg-paper-50/80 p-4"
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

      <div className="overflow-hidden rounded-[var(--radius-1)] border border-ink-100 bg-paper-0">
        <div className="border-b border-ink-100 bg-paper-50/80 px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="blue" className="shrink-0">
              {kindLabel}
            </Badge>
            <Badge variant={canRead ? "green" : "warm-gray"} className="shrink-0">
              {canRead
                ? t("included")
                : pendingUnlockAfterCheckout
                  ? t("licensePending")
                  : t("notIncluded")}
            </Badge>
          </div>
          <h1 className="mt-3 text-xl font-semibold tracking-tight text-ink-900">
            {product.title}
          </h1>
          <p className="mt-2 text-lg font-medium tabular-nums text-ink-900">
            {formatCurrencyMinor(product.price_cents, product.currency)}
          </p>
        </div>

        <div className="px-5 py-5 space-y-6">
          {product.description ? (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                {t("detailAboutHeading")}
              </h2>
              <div
                className={cn(
                  "mt-2 text-sm leading-relaxed text-ink-700",
                  "whitespace-pre-wrap",
                )}
              >
                {product.description}
              </div>
            </section>
          ) : null}

          {outlineLines.length > 0 ? (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                {t("detailOutlineHeading")}
              </h2>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-ink-700">
                {outlineLines.map((line) => (
                  <li key={line} className="leading-relaxed">
                    {line.replace(/^[-•*]\s+/, "").replace(/^\d+[.)]\s+/, "")}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <div className="flex flex-col gap-3 border-t border-ink-100 pt-5 sm:flex-row sm:flex-wrap sm:items-center">
            {!canRead && !pendingUnlockAfterCheckout ? (
              <Link
                href={`/dashboard/library/${encodeURIComponent(slug)}/checkout`}
                prefetch={false}
                className="inline-flex items-center justify-center rounded-[var(--radius-1)] bg-primary px-4 py-2.5 text-sm font-medium text-[var(--color-text-on-color)] transition-opacity hover:opacity-90"
              >
                {t("detailPurchase")}
              </Link>
            ) : null}
            {canRead && product.delivery_mode === "pdf" && product.storage_object_path ? (
              <LibraryPdfDownloadActions productId={product.id} />
            ) : null}
            {canRead && product.delivery_mode === "web_only" ? (
              <LibraryReadOnlineButton productId={product.id} slug={product.slug}>
                {t("readOnline")}
              </LibraryReadOnlineButton>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
