import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ensureDefaultOrganization } from "@/actions/onboarding";
import { ActionErrorMessage } from "@/components/i18n/action-error-message";
import { BillingFunnelCapture } from "@/components/analytics/billing-funnel-capture";
import { BillingOrgSummary } from "@/components/dashboard/billing-org-summary";
import {
  BillingLemonCheckout,
  type LemonBillingUnconfiguredReason,
} from "@/components/dashboard/billing-lemon-checkout";
import { BillingTossWidget } from "@/components/dashboard/billing-toss-widget";
import type { OrgPlan } from "@/lib/organizations/plan";
import { resolveLemonCheckoutForBillingPage } from "@/lib/payments/resolve-lemon-checkout-for-billing";
import { getTossWidgetClientKey } from "@/lib/env/toss";
import { getCatalogPaymentProvider } from "@/lib/payments/catalog-payment-provider";
import { TOSS_POC_AMOUNT_KRW } from "@/lib/payments/toss-poc";
import { createClient } from "@/lib/supabase/server";
import { resolveAppOrigin } from "@/lib/url/resolve-app-origin";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Dashboard.pages");
  return { title: t("billing.title") };
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>;
}) {
  const { product: productParam } = await searchParams;
  const contentProductSlug =
    typeof productParam === "string" && productParam.trim().length > 0
      ? productParam.trim()
      : null;
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

  const { data: prof } = user
    ? await supabase
        .from("profiles")
        .select("display_name, organization_id")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  let billingOrg: { name: string; plan: OrgPlan } | null = null;
  if (prof?.organization_id) {
    const { data: org } = await supabase
      .from("organizations")
      .select("name, plan")
      .eq("id", prof.organization_id)
      .maybeSingle();
    if (org?.name) {
      billingOrg = {
        name: org.name,
        plan: (org.plan ?? "starter") as OrgPlan,
      };
    }
  }

  const provider = getCatalogPaymentProvider();
  const origin = await resolveAppOrigin();

  let lemonCheckoutUrl: string | null = null;
  let lemonEmbedsCustomData = false;
  let lemonUnconfigured: LemonBillingUnconfiguredReason | null = null;

  if (provider === "lemon" && contentProductSlug) {
    const r = await resolveLemonCheckoutForBillingPage({
      contentProductSlug,
      organizationId: prof?.organization_id ?? null,
      appOrigin: origin,
    });
    if (r.checkoutUrl) {
      lemonCheckoutUrl = r.checkoutUrl;
      lemonEmbedsCustomData = r.embedsCustomDataInCheckout;
    } else if ("reason" in r) {
      const map: Record<string, LemonBillingUnconfiguredReason> = {
        not_linked: "not_linked",
        api_not_configured: "api_not_configured",
        checkout_api_failed: "checkout_api_failed",
        price_below_lemon_minimum: "price_below_lemon_minimum",
        unknown_product: "unknown_product",
        no_slug: "not_linked",
      };
      lemonUnconfigured = map[r.reason] ?? "not_linked";
    }
  }

  const widgetKey = getTossWidgetClientKey();
  const t = await getTranslations("Dashboard.pages");
  const tb = await getTranslations("Dashboard.billing");

  return (
    <div className="min-h-screen bg-paper-50">
      <div className="sticky top-0 z-30 flex items-center border-b border-ink-100 bg-paper-50 px-6 h-12">
        <h1 className="text-sm font-medium text-ink-900">{t("billing.title")}</h1>
      </div>
      <div className="mx-auto w-full max-w-xl space-y-6 p-6">
        <div className="flex justify-end">
          <Link
            href="/dashboard/billing/purchases"
            className="text-sm font-medium text-primary hover:underline"
          >
            {tb("linkPurchaseHistory")}
          </Link>
        </div>
        <BillingFunnelCapture productSlug={contentProductSlug} />
        {billingOrg ? (
          <BillingOrgSummary organizationName={billingOrg.name} plan={billingOrg.plan} />
        ) : null}
        {provider === "lemon" && contentProductSlug ? (
          <BillingLemonCheckout
            contentProductSlug={contentProductSlug}
            checkoutUrl={lemonCheckoutUrl}
            organizationId={prof?.organization_id ?? null}
            profileEmail={user?.email ?? null}
            embedsCustomDataInCheckout={lemonEmbedsCustomData}
            unconfiguredReason={lemonUnconfigured}
          />
        ) : null}
        {provider === "toss" ? (
          <>
            {contentProductSlug ? (
              <p className="text-sm text-ink-700 leading-relaxed">
                {tb("checkoutWithSlug", {
                  slug: contentProductSlug,
                  amount: TOSS_POC_AMOUNT_KRW,
                })}
              </p>
            ) : (
              <p className="text-sm text-ink-700 leading-relaxed">
                {tb("tossIntroNoSlug", { amount: TOSS_POC_AMOUNT_KRW })}
              </p>
            )}
            {contentProductSlug ? (
              <p className="text-sm text-ink-700 leading-relaxed">
                {tb("tossIntro", { amount: TOSS_POC_AMOUNT_KRW })}
              </p>
            ) : null}
            {user && widgetKey ? (
              <BillingTossWidget
                clientKey={widgetKey}
                customerKey={user.id}
                appOrigin={origin}
                customerEmail={user.email ?? null}
                customerName={prof?.display_name?.trim() || null}
                contentProductSlug={contentProductSlug}
              />
            ) : (
              <p className="text-sm text-ink-500">{tb("setClientKey")}</p>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
