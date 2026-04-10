import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { ContentProductKind } from "@/lib/data/library";

export type EntitlementHistoryRow = {
  id: string;
  granted_at: string;
  product: {
    slug: string;
    title: string;
    price_cents: number;
    currency: string;
    product_kind: ContentProductKind;
  } | null;
};

export type TossHistoryRow = {
  id: string;
  order_id: string;
  amount_krw: number;
  status: string;
  confirmed_at: string | null;
  created_at: string;
  product: { slug: string; title: string } | null;
};

/**
 * Purchase-related history for the current organization (RLS-scoped).
 * Catalog unlocks from entitlements; Toss PoC rows when present.
 */
export async function loadOrgPurchaseHistory(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<{
  entitlements: EntitlementHistoryRow[];
  tossPayments: TossHistoryRow[];
}> {
  const { data: entRows, error: entErr } = await supabase
    .from("organization_content_entitlements")
    .select(
      `
      id,
      granted_at,
      content_products (
        slug,
        title,
        price_cents,
        currency,
        product_kind
      )
    `,
    )
    .eq("organization_id", organizationId)
    .order("granted_at", { ascending: false });

  if (entErr) throw entErr;

  const { data: tossRows, error: tossErr } = await supabase
    .from("toss_payment_intents")
    .select(
      `
      id,
      order_id,
      amount_krw,
      status,
      confirmed_at,
      created_at,
      content_products (
        slug,
        title
      )
    `,
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (tossErr) throw tossErr;

  const entitlements: EntitlementHistoryRow[] = (entRows ?? []).map((row) => {
    const cp = row.content_products;
    const product = Array.isArray(cp) ? cp[0] : cp;
    if (!product || typeof product !== "object") {
      return {
        id: row.id,
        granted_at: row.granted_at,
        product: null,
      };
    }
    return {
      id: row.id,
      granted_at: row.granted_at,
      product: {
        slug: product.slug,
        title: product.title,
        price_cents: product.price_cents,
        currency: product.currency,
        product_kind: (product.product_kind ?? "ebook") as ContentProductKind,
      },
    };
  });

  const tossPayments: TossHistoryRow[] = (tossRows ?? []).map((row) => {
    const cp = row.content_products;
    const product = Array.isArray(cp) ? cp[0] : cp;
    return {
      id: row.id,
      order_id: row.order_id,
      amount_krw: row.amount_krw,
      status: row.status,
      confirmed_at: row.confirmed_at,
      created_at: row.created_at,
      product:
        product && typeof product === "object"
          ? { slug: product.slug, title: product.title }
          : null,
    };
  });

  return { entitlements, tossPayments };
}
