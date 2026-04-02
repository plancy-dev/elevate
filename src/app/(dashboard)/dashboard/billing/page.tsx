import type { Metadata } from "next";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { ensureDefaultOrganization } from "@/actions/onboarding";
import { ActionErrorMessage } from "@/components/i18n/action-error-message";
import { BillingFunnelCapture } from "@/components/analytics/billing-funnel-capture";
import { BillingTossWidget } from "@/components/dashboard/billing-toss-widget";
import { getTossWidgetClientKey } from "@/lib/env/toss";
import { TOSS_POC_AMOUNT_KRW } from "@/lib/payments/toss-poc";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Dashboard.pages");
  return { title: t("billing.title") };
}

async function resolveAppOrigin(): Promise<string> {
  const env = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (env) return env.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
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
      <div className="min-h-screen bg-background p-6">
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
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  const widgetKey = getTossWidgetClientKey();
  const origin = await resolveAppOrigin();
  const t = await getTranslations("Dashboard.pages");
  const tb = await getTranslations("Dashboard.billing");

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-30 flex items-center border-b border-border-subtle bg-background px-6 h-12">
        <h1 className="text-sm font-medium text-text-primary">{t("billing.title")}</h1>
      </div>
      <div className="p-6 max-w-xl space-y-6">
        <BillingFunnelCapture productSlug={contentProductSlug} />
        {contentProductSlug ? (
          <p className="text-sm text-text-secondary leading-relaxed">
            {tb("checkoutWithSlug", {
              slug: contentProductSlug,
              amount: TOSS_POC_AMOUNT_KRW,
            })}
          </p>
        ) : null}
        <p className="text-sm text-text-secondary leading-relaxed">
          {tb("tossIntro", { amount: TOSS_POC_AMOUNT_KRW })}
        </p>
        <p className="text-xs text-text-tertiary leading-relaxed">
          {tb("registerUrls")}
        </p>
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
          <p className="text-sm text-text-tertiary">{tb("setClientKey")}</p>
        )}
        <p className="text-sm text-text-tertiary border-t border-border-subtle pt-4">
          {tb("footerDocs")}
        </p>
      </div>
    </div>
  );
}
