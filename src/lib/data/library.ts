import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { OrgPlan } from "@/lib/organizations/plan";

type ContentProductListRow = Pick<
  Database["public"]["Tables"]["content_products"]["Row"],
  | "id"
  | "slug"
  | "title"
  | "description"
  | "price_cents"
  | "currency"
  | "product_kind"
  | "delivery_mode"
  | "storage_object_path"
>;

/** Aligns with `content_products.product_kind` (migration 010). */
export type ContentProductKind = "ebook" | "guide" | "template" | "bundle";

/** Aligns with `content_products.delivery_mode` (migration 013). */
export type EbookDeliveryMode = "pdf" | "web_only";

export type LibraryProductRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  price_cents: number;
  currency: string;
  product_kind: ContentProductKind;
  delivery_mode: EbookDeliveryMode;
  storage_object_path: string | null;
};

const PRODUCT_LIST_SELECT =
  "id, slug, title, description, price_cents, currency, product_kind, delivery_mode, storage_object_path" as const;

function mapContentProductRow(p: ContentProductListRow): LibraryProductRow {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    description: p.description,
    price_cents: p.price_cents,
    currency: p.currency,
    product_kind: (p.product_kind ?? "ebook") as ContentProductKind,
    delivery_mode: (p.delivery_mode ?? "pdf") as EbookDeliveryMode,
    storage_object_path: p.storage_object_path ?? null,
  };
}

/** Org plan + entitlement IDs for Library / catalog detail (shared by list + detail). */
export async function getLibraryEntitlementContext(
  supabase: SupabaseClient<Database>,
  organizationId: string | null,
): Promise<{
  entitledIds: Set<string>;
  organizationPlan: OrgPlan | null;
}> {
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

  return { entitledIds, organizationPlan };
}

export async function getLibraryPageData(
  supabase: SupabaseClient<Database>,
  organizationId: string | null,
): Promise<{
  products: LibraryProductRow[];
  entitledIds: Set<string>;
  organizationPlan: OrgPlan | null;
}> {
  const ctx = await getLibraryEntitlementContext(supabase, organizationId);

  const { data: products, error: pErr } = await supabase
    .from("content_products")
    .select(PRODUCT_LIST_SELECT)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (pErr) {
    throw pErr;
  }

  const rows = (products ?? []) as ContentProductListRow[];
  return {
    products: rows.map(mapContentProductRow),
    entitledIds: ctx.entitledIds,
    organizationPlan: ctx.organizationPlan,
  };
}

/**
 * Single catalog row for Library detail — **one query by slug** + entitlement context
 * (avoids loading the full catalog on every detail view).
 */
export async function getLibraryProductBySlug(
  supabase: SupabaseClient<Database>,
  organizationId: string | null,
  slug: string,
): Promise<{
  product: LibraryProductRow | null;
  entitledIds: Set<string>;
  organizationPlan: OrgPlan | null;
}> {
  const ctx = await getLibraryEntitlementContext(supabase, organizationId);

  const { data: row, error } = await supabase
    .from("content_products")
    .select(PRODUCT_LIST_SELECT)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!row) {
    return {
      product: null,
      entitledIds: ctx.entitledIds,
      organizationPlan: ctx.organizationPlan,
    };
  }

  return {
    product: mapContentProductRow(row as ContentProductListRow),
    entitledIds: ctx.entitledIds,
    organizationPlan: ctx.organizationPlan,
  };
}
