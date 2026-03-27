import { headers } from "next/headers";
import { ensureDefaultOrganization } from "@/actions/onboarding";
import { BillingTossWidget } from "@/components/dashboard/billing-toss-widget";
import { getTossWidgetClientKey } from "@/lib/env/toss";
import { TOSS_POC_AMOUNT_KRW } from "@/lib/payments/toss-poc";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Billing" };

async function resolveAppOrigin(): Promise<string> {
  const env = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (env) return env.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export default async function BillingPage() {
  const ensured = await ensureDefaultOrganization();
  if (!ensured.ok) {
    return (
      <div className="min-h-screen bg-background p-6">
        <p className="text-sm text-danger">{ensured.error}</p>
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

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-30 flex items-center border-b border-border-subtle bg-background px-6 h-12">
        <h1 className="text-sm font-medium text-text-primary">Billing</h1>
      </div>
      <div className="p-6 max-w-xl space-y-6">
        <p className="text-sm text-text-secondary leading-relaxed">
          Toss Payments test flow: pay {TOSS_POC_AMOUNT_KRW} KRW with the widget
          below (test keys). Success redirects here for server-side confirmation;
          webhooks can be registered for{" "}
          <code className="text-text-primary text-xs">
            /api/webhooks/toss
          </code>{" "}
          (requires a public URL, e.g. ngrok locally).
        </p>
        <p className="text-xs text-text-tertiary leading-relaxed">
          Register success/fail URLs in the Toss dashboard to match{" "}
          <code className="text-text-secondary">NEXT_PUBLIC_APP_URL</code>{" "}
          (e.g.{" "}
          <code className="text-text-secondary">
            …/dashboard/billing/success
          </code>
          ).
        </p>
        {user && widgetKey ? (
          <BillingTossWidget
            clientKey={widgetKey}
            customerKey={user.id}
            appOrigin={origin}
            customerEmail={user.email ?? null}
            customerName={prof?.display_name?.trim() || null}
          />
        ) : (
          <p className="text-sm text-text-tertiary">
            Set{" "}
            <code className="text-text-secondary">
              NEXT_PUBLIC_TOSS_WIDGET_CLIENT_KEY
            </code>{" "}
            (and server secrets per{" "}
            <code className="text-text-secondary">docs/adr/ADR-001-toss-payments-poc.md</code>
            ) to enable the PoC widget.
          </p>
        )}
        <p className="text-sm text-text-tertiary border-t border-border-subtle pt-4">
          Details:{" "}
          <code className="text-text-primary">docs/adr/ADR-001-toss-payments-poc.md</code>
          , migration <code className="text-text-secondary">008_toss_payment_intents</code>.
        </p>
      </div>
    </div>
  );
}
