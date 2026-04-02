import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { OrgPlan } from "@/lib/organizations/plan";

/** Aligns with `content_products.product_kind` (migration 010). */
export type ContentProductKind = "ebook" | "guide" | "template" | "bundle";

export type LibraryProductRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  price_cents: number;
  currency: string;
  product_kind: ContentProductKind;
  storage_object_path: string | null;
};

export async function getLibraryPageData(
  supabase: SupabaseClient<Database>,
  organizationId: string | null,
): Promise<{
  products: LibraryProductRow[];
  entitledIds: Set<string>;
  organizationPlan: OrgPlan | null;
}> {
  const { data: products, error: pErr } = await supabase
    .from("content_products")
    .select(
      "id, slug, title, description, price_cents, currency, product_kind, storage_object_path",
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (pErr) {
    throw pErr;
  }

  let entitledIds = new Set<string>();
  let organizationPlan: OrgPlan | null = null;

  if (organizationId) {
    const { data: org, error: oErr } = await supabase
      .from("organizations")
      .select("plan")
      .eq("id", organizationId)
      .maybeSingle();

    if (oErr) {
      throw oErr;
    }
    organizationPlan = org?.plan ?? null;

    const { data: ents, error: eErr } = await supabase
      .from("organization_content_entitlements")
      .select("content_product_id")
      .eq("organization_id", organizationId);

    if (eErr) {
      throw eErr;
    }
    entitledIds = new Set((ents ?? []).map((e) => e.content_product_id));
  }

  const rows = (products ?? []) as LibraryProductRow[];
  return {
    products: rows.map((p) => ({
      ...p,
      product_kind: (p.product_kind ?? "ebook") as ContentProductKind,
      storage_object_path: p.storage_object_path ?? null,
    })),
    entitledIds,
    organizationPlan,
  };
}
