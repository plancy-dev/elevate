"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { canAccessElevateServiceAdmin } from "@/lib/auth/platform-admin";
import {
  getLemonSqueezyServerConfig,
  listStoreProducts,
  listVariantsForProduct,
  type LemonProductSummary,
  type LemonVariantSummary,
} from "@/lib/payments/lemon-squeezy-api";

async function assertPlatformAdmin(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false, error: "unauthorized" };

  if (!canAccessElevateServiceAdmin(user.email)) {
    return { ok: false, error: "forbidden" };
  }
  return { ok: true };
}

export async function listLemonProductsForAdmin(): Promise<
  { ok: true; products: LemonProductSummary[] } | { ok: false; error: string }
> {
  const gate = await assertPlatformAdmin();
  if (!gate.ok) {
    return { ok: false, error: gate.error };
  }
  const cfg = getLemonSqueezyServerConfig();
  if (!cfg) {
    return { ok: false, error: "lemon_api_not_configured" };
  }
  try {
    const products = await listStoreProducts(cfg.apiKey, cfg.storeId);
    return { ok: true, products };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    return { ok: false, error: msg };
  }
}

export async function listLemonVariantsForAdmin(
  lemonProductId: string,
): Promise<
  { ok: true; variants: LemonVariantSummary[] } | { ok: false; error: string }
> {
  const gate = await assertPlatformAdmin();
  if (!gate.ok) {
    return { ok: false, error: gate.error };
  }
  const cfg = getLemonSqueezyServerConfig();
  if (!cfg) {
    return { ok: false, error: "lemon_api_not_configured" };
  }
  const id = lemonProductId.trim();
  if (!id) {
    return { ok: false, error: "invalid_product" };
  }
  try {
    const variants = await listVariantsForProduct(cfg.apiKey, id);
    return { ok: true, variants };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    return { ok: false, error: msg };
  }
}

export type UpsertLemonLinkResult = { ok: true } | { ok: false; error: string };

export async function upsertContentProductLemonLink(input: {
  contentProductId: string;
  lemonVariantId: string;
  lemonProductId?: string | null;
}): Promise<UpsertLemonLinkResult> {
  const gate = await assertPlatformAdmin();
  if (!gate.ok) {
    return { ok: false, error: gate.error };
  }

  const contentProductId = input.contentProductId.trim();
  const lemonVariantId = input.lemonVariantId.trim();
  const lemonProductId = input.lemonProductId?.trim() || null;

  if (!contentProductId || !lemonVariantId) {
    return { ok: false, error: "invalid_payload" };
  }

  const admin = createAdminClient();
  const { data: product } = await admin
    .from("content_products")
    .select("id")
    .eq("id", contentProductId)
    .maybeSingle();

  if (!product?.id) {
    return { ok: false, error: "unknown_product" };
  }

  const { error } = await admin.from("content_product_lemon_links").upsert(
    {
      content_product_id: contentProductId,
      lemon_variant_id: lemonVariantId,
      lemon_product_id: lemonProductId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "content_product_id" },
  );

  if (error) {
    return { ok: false, error: "db_failed" };
  }

  revalidatePath("/admin/content");
  revalidatePath("/dashboard/billing");
  revalidatePath("/dashboard/library");
  return { ok: true };
}

export async function clearContentProductLemonLink(
  contentProductId: string,
): Promise<UpsertLemonLinkResult> {
  const gate = await assertPlatformAdmin();
  if (!gate.ok) {
    return { ok: false, error: gate.error };
  }
  const id = contentProductId.trim();
  if (!id) {
    return { ok: false, error: "invalid_payload" };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("content_product_lemon_links")
    .delete()
    .eq("content_product_id", id);

  if (error) {
    return { ok: false, error: "db_failed" };
  }

  revalidatePath("/admin/content");
  revalidatePath("/dashboard/billing");
  revalidatePath("/dashboard/library");
  return { ok: true };
}
