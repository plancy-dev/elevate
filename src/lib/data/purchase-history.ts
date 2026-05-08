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

/**
 * Purchase-related history for the current organization (RLS-scoped).
 * Catalog unlocks from entitlements (Lemon / Polar webhooks grant rows here).
 */
export async function loadOrgPurchaseHistory(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<{
  entitlements: EntitlementHistoryRow[];
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

  return { entitlements };
}
