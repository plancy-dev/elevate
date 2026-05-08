import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ensureDefaultOrganization } from "@/actions/onboarding";
import { ActionErrorMessage } from "@/components/i18n/action-error-message";
import { Badge } from "@/components/ui/badge";
import { loadOrgPurchaseHistory } from "@/lib/data/purchase-history";
import type { ContentProductKind } from "@/lib/data/library";
import { createClient } from "@/lib/supabase/server";
import { getAppLocale } from "@/lib/i18n/app-locale";
import { formatCurrencyMinor } from "@/lib/format-currency";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Dashboard.pages");
  return { title: t("purchases.title") };
}

function productKindKey(
  kind: ContentProductKind,
): "productKind.ebook" | "productKind.guide" | "productKind.template" | "productKind.bundle" {
  return `productKind.${kind}`;
}

function formatTs(iso: string, locale: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export default async function PurchaseHistoryPage() {
  const ensured = await ensureDefaultOrganization();
  if (!ensured.ok) {
    return (
      <div className="min-h-screen bg-paper-50 p-6">
        <ActionErrorMessage code={ensured.error} />
      </div>
    );
  }

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
  const locale = await getAppLocale();
  const t = await getTranslations("Dashboard.billing.purchaseHistory");
  const tLib = await getTranslations("Dashboard.library");
  const tPages = await getTranslations("Dashboard.pages");

  let entitlements: Awaited<ReturnType<typeof loadOrgPurchaseHistory>>["entitlements"] = [];

  if (orgId) {
    const data = await loadOrgPurchaseHistory(supabase, orgId);
    entitlements = data.entitlements;
  }

  const hasAny = entitlements.length > 0;

  return (
    <div className="min-h-screen bg-paper-50">
      <div className="sticky top-0 z-30 flex items-center border-b border-ink-100 bg-paper-50 px-6 h-12">
        <h1 className="text-sm font-medium text-ink-900">{tPages("purchases.title")}</h1>
      </div>
      <div className="mx-auto w-full max-w-3xl space-y-8 p-6">
        <nav className="text-sm">
          <Link href="/dashboard/billing" className="font-medium text-primary hover:underline">
            {t("backToBilling")}
          </Link>
        </nav>

        <p className="text-sm text-ink-700 leading-relaxed max-w-2xl">{t("intro")}</p>

        {!orgId ? (
          <p className="text-sm text-ink-500">{t("noOrganization")}</p>
        ) : !hasAny ? (
          <div className="rounded-[var(--radius-1)] border border-ink-100 bg-paper-0 p-6">
            <p className="text-sm text-ink-700">{t("empty")}</p>
            <Link
              href="/dashboard/library"
              className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
            >
              {t("openLibrary")}
            </Link>
          </div>
        ) : (
          <div className="space-y-10">
            {entitlements.length > 0 ? (
              <section aria-labelledby="ph-unlocks">
                <h3
                  id="ph-unlocks"
                  className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-3"
                >
                  {t("sectionUnlocks")}
                </h3>
                <div className="overflow-hidden rounded-[var(--radius-1)] border border-ink-100 bg-paper-0">
                  <ul className="divide-y divide-ink-100">
                    {entitlements.map((row) => (
                      <li key={row.id} className="px-5 py-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            {row.product ? (
                              <>
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge variant="blue" className="shrink-0">
                                    {tLib(productKindKey(row.product.product_kind))}
                                  </Badge>
                                  <Link
                                    href={`/dashboard/library/${encodeURIComponent(row.product.slug)}`}
                                    className="text-sm font-semibold text-ink-900 hover:text-vermilion-700 hover:underline"
                                  >
                                    {row.product.title}
                                  </Link>
                                </div>
                                <p className="mt-1 text-sm tabular-nums text-ink-700">
                                  {formatCurrencyMinor(row.product.price_cents, row.product.currency)}
                                </p>
                              </>
                            ) : (
                              <p className="text-sm text-ink-500">{t("removedProduct")}</p>
                            )}
                          </div>
                          <p className="text-xs text-ink-500 shrink-0 sm:text-right">
                            {t("unlockedAt", { date: formatTs(row.granted_at, locale) })}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            ) : null}
          </div>
        )}

        <p className="text-xs text-ink-500 leading-relaxed border-t border-ink-100 pt-6">
          {t("orgScopeFootnote")}
        </p>
      </div>
    </div>
  );
}
