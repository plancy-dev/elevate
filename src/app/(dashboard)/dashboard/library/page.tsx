import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  CONTENT_PRODUCT_KIND_LABEL,
  getLibraryPageData,
} from "@/lib/data/library";
import { FunnelCaptureOnce } from "@/components/analytics/funnel-capture";
import { LibraryDownloadButton } from "@/components/dashboard/library-download-button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PostHogEvent } from "@/lib/analytics/posthog-events";
import { formatCurrencyMinor } from "@/lib/format-currency";
import { TOSS_POC_AMOUNT_KRW } from "@/lib/payments/toss-poc";

const copy = {
  title: "Library",
  subtitle:
    "Your purchased digital products (e-books and guides first). Entitlements are granted per organization after payment—see migration 009/010 and ops runbook.",
  empty:
    "No catalog rows yet. Apply migrations through 010, then insert into content_products (set product_kind, e.g. ebook).",
  included: "Included for your org",
  notIncluded: "Not licensed",
  legacyNote:
    "Legacy MICE (events, venues, attendees) stays under the sidebar until deprecated.",
};

export default async function LibraryPage() {
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
  const { products, entitledIds } = await getLibraryPageData(supabase, orgId);

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <FunnelCaptureOnce event={PostHogEvent.ELEVATE_FUNNEL_LIBRARY_VIEW} />
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
          {copy.title}
        </h1>
        <p className="mt-2 text-sm text-text-tertiary leading-relaxed max-w-2xl">
          {copy.subtitle}
        </p>
      </div>

      {products.length === 0 ? (
        <p className="text-sm text-text-secondary">{copy.empty}</p>
      ) : (
        <ul className="space-y-4">
          {products.map((p) => {
            const ok = entitledIds.has(p.id);
            const kindLabel =
              CONTENT_PRODUCT_KIND_LABEL[p.product_kind] ?? p.product_kind;
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
                        <Badge variant={ok ? "green" : "warm-gray"}>
                          {ok ? copy.included : copy.notIncluded}
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
                      {!ok ? (
                        <Link
                          href={`/dashboard/billing?product=${encodeURIComponent(p.slug)}`}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          Pay {TOSS_POC_AMOUNT_KRW} KRW (PoC)
                        </Link>
                      ) : null}
                      {ok && p.storage_object_path ? (
                        <LibraryDownloadButton productId={p.id}>
                          Download
                        </LibraryDownloadButton>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-10 text-xs text-text-tertiary border-t border-border-subtle pt-6">
        {copy.legacyNote}
      </p>
    </div>
  );
}
