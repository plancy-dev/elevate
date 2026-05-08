"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { canAccessElevateServiceAdmin } from "@/lib/auth/platform-admin";
import { getContentStorageBucket } from "@/lib/env/content-storage";
import {
  buildCatalogStorageObjectPath,
  normalizeOriginalFileNameForDb,
} from "@/lib/content/storage-filename";
import { LEMON_CUSTOM_PRICE_MIN_KRW } from "@/lib/payments/lemon-custom-price-minimum";
import {
  clearContentProductLemonLink,
  upsertContentProductLemonLink,
} from "@/actions/lemon-squeezy-catalog-admin";

const MAX_BYTES = 120 * 1024 * 1024; // 120 MB
const ALLOWED_EXT = new Set(["pdf", "epub", "zip"]);
const PRODUCT_KINDS = ["ebook", "guide", "template", "bundle"] as const;
type ProductKind = (typeof PRODUCT_KINDS)[number];

function parseProductKind(raw: string): ProductKind {
  const t = raw.trim();
  return PRODUCT_KINDS.includes(t as ProductKind) ? (t as ProductKind) : "ebook";
}

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

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

export type UploadContentProductResult =
  | { ok: true; replaced: boolean }
  | { ok: false; error: string };

export type MutateContentProductResult = { ok: true } | { ok: false; error: string };

/**
 * Uploads a file to Storage and creates or updates `content_products` (ebook / catalog row).
 */
export async function uploadContentProduct(
  _prev: UploadContentProductResult | undefined,
  formData: FormData,
): Promise<UploadContentProductResult> {
  const gate = await assertPlatformAdmin();
  if (!gate.ok) {
    return { ok: false, error: gate.error };
  }

  const slugRaw = String(formData.get("slug") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priceKrwRaw = String(formData.get("priceKrw") ?? "");
  const productKind = parseProductKind(
    String(formData.get("productKind") ?? "ebook"),
  );
  const replaceExisting = formData.get("replaceExisting") === "on";
  const file = formData.get("file");

  const slug = slugify(slugRaw);
  if (!slug) {
    return { ok: false, error: "invalid_slug" };
  }
  if (!title) {
    return { ok: false, error: "title_required" };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "file_required" };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "file_too_large" };
  }

  const originalName = file.name.trim() || "download.bin";
  const ext = originalName.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXT.has(ext)) {
    return { ok: false, error: "file_type" };
  }

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("content_products")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existing?.id && !replaceExisting) {
    return { ok: false, error: "slug_taken" };
  }

  let priceKrw = Number.parseInt(priceKrwRaw, 10);
  if (!Number.isFinite(priceKrw) || priceKrw < 0) {
    priceKrw = LEMON_CUSTOM_PRICE_MIN_KRW;
  }
  const priceCents = priceKrw * 100;

  const originalFileName = normalizeOriginalFileNameForDb(originalName);
  const storagePath = buildCatalogStorageObjectPath(slug, ext);

  const bucket = getContentStorageBucket();

  const buf = Buffer.from(await file.arrayBuffer());
  const { error: upErr } = await admin.storage
    .from(bucket)
    .upload(storagePath, buf, {
      contentType: file.type || "application/octet-stream",
      upsert: true,
    });

  if (upErr) {
    return { ok: false, error: "storage_upload_failed" };
  }

  const row = {
    slug,
    title,
    description,
    price_cents: priceCents,
    currency: "KRW",
    is_active: true,
    product_kind: productKind,
    storage_object_path: storagePath,
    original_file_name: originalFileName,
  };

  if (existing?.id) {
    const { error: uErr } = await admin
      .from("content_products")
      .update(row)
      .eq("id", existing.id);
    if (uErr) return { ok: false, error: "db_update_failed" };
  } else {
    const { error: iErr } = await admin.from("content_products").insert(row);
    if (iErr) return { ok: false, error: "db_insert_failed" };
  }

  revalidatePath("/dashboard/library");
  revalidatePath("/product/ebooks-and-guides");
  revalidatePath("/admin/content");
  return { ok: true, replaced: Boolean(existing?.id) };
}

/**
 * Updates catalog metadata and optionally replaces the storage file.
 */
export async function updateContentProduct(
  _prev: MutateContentProductResult | undefined,
  formData: FormData,
): Promise<MutateContentProductResult> {
  const gate = await assertPlatformAdmin();
  if (!gate.ok) {
    return { ok: false, error: gate.error };
  }

  const id = String(formData.get("contentProductId") ?? "").trim();
  if (!id) {
    return { ok: false, error: "invalid_id" };
  }

  const slugRaw = String(formData.get("slug") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priceKrwRaw = String(formData.get("priceKrw") ?? "");
  const productKind = parseProductKind(String(formData.get("productKind") ?? "ebook"));
  const isActive = formData.get("isActive") === "on";
  const file = formData.get("replaceFile");

  const slug = slugify(slugRaw);
  if (!slug) {
    return { ok: false, error: "invalid_slug" };
  }
  if (!title) {
    return { ok: false, error: "title_required" };
  }

  let priceKrw = Number.parseInt(priceKrwRaw, 10);
  if (!Number.isFinite(priceKrw) || priceKrw < 0) {
    priceKrw = LEMON_CUSTOM_PRICE_MIN_KRW;
  }
  const priceCents = priceKrw * 100;

  const admin = createAdminClient();

  const { data: row, error: loadErr } = await admin
    .from("content_products")
    .select("id, slug, storage_object_path")
    .eq("id", id)
    .maybeSingle();

  if (loadErr || !row?.id) {
    return { ok: false, error: "not_found" };
  }

  const { data: slugConflict } = await admin
    .from("content_products")
    .select("id")
    .eq("slug", slug)
    .neq("id", id)
    .maybeSingle();

  if (slugConflict?.id) {
    return { ok: false, error: "slug_taken_edit" };
  }

  const bucket = getContentStorageBucket();
  let storagePath = row.storage_object_path;
  let uploadedOriginalFileName: string | undefined;

  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_BYTES) {
      return { ok: false, error: "file_too_large" };
    }
    const originalName = file.name.trim() || "download.bin";
    const ext = originalName.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_EXT.has(ext)) {
      return { ok: false, error: "file_type" };
    }
    uploadedOriginalFileName = normalizeOriginalFileNameForDb(originalName);
    const nextPath = buildCatalogStorageObjectPath(slug, ext);
    const buf = Buffer.from(await file.arrayBuffer());
    const { error: upErr } = await admin.storage
      .from(bucket)
      .upload(nextPath, buf, {
        contentType: file.type || "application/octet-stream",
        upsert: true,
      });
    if (upErr) {
      return { ok: false, error: "storage_upload_failed" };
    }
    if (row.storage_object_path) {
      await admin.storage.from(bucket).remove([row.storage_object_path]);
    }
    storagePath = nextPath;
  }

  const fileReplaced =
    file instanceof File && file.size > 0 && storagePath !== row.storage_object_path;

  const { error: uErr } = await admin
    .from("content_products")
    .update({
      slug,
      title,
      description,
      price_cents: priceCents,
      currency: "KRW",
      is_active: isActive,
      product_kind: productKind,
      ...(storagePath !== row.storage_object_path ? { storage_object_path: storagePath } : {}),
      ...(fileReplaced && uploadedOriginalFileName
        ? { original_file_name: uploadedOriginalFileName }
        : {}),
    })
    .eq("id", id);

  if (uErr) {
    return { ok: false, error: "db_update_failed" };
  }

  const hadLemonLinkBefore =
    String(formData.get("hadLemonLinkBefore") ?? "").trim() === "1";
  const lemonVariantRaw = String(formData.get("lemonVariantId") ?? "").trim();
  const lemonProductRaw = String(formData.get("lemonProductId") ?? "").trim();
  const lemonProductIdForLink = lemonProductRaw.length > 0 ? lemonProductRaw : null;

  if (lemonVariantRaw.length > 0) {
    const lemonRes = await upsertContentProductLemonLink({
      contentProductId: id,
      lemonVariantId: lemonVariantRaw,
      lemonProductId: lemonProductIdForLink,
    });
    if (!lemonRes.ok) {
      return { ok: false, error: "lemon_link_failed" };
    }
  } else if (hadLemonLinkBefore) {
    const lemonRes = await clearContentProductLemonLink(id);
    if (!lemonRes.ok) {
      return { ok: false, error: "lemon_link_failed" };
    }
  }

  revalidatePath("/dashboard/library");
  revalidatePath("/product/ebooks-and-guides");
  revalidatePath("/admin/content");
  revalidatePath("/dashboard/billing");
  return { ok: true };
}

/**
 * Deletes a catalog row and its storage object. Cascades Lemon links and related FK rows.
 */
export async function deleteContentProduct(productId: string): Promise<MutateContentProductResult> {
  const gate = await assertPlatformAdmin();
  if (!gate.ok) {
    return { ok: false, error: gate.error };
  }

  const id = productId.trim();
  if (!id) {
    return { ok: false, error: "invalid_id" };
  }

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("content_products")
    .select("id, storage_object_path")
    .eq("id", id)
    .maybeSingle();

  if (!row?.id) {
    return { ok: false, error: "not_found" };
  }

  const bucket = getContentStorageBucket();
  if (row.storage_object_path) {
    await admin.storage.from(bucket).remove([row.storage_object_path]);
  }

  const { error: dErr } = await admin.from("content_products").delete().eq("id", id);
  if (dErr) {
    return { ok: false, error: "db_delete_failed" };
  }

  revalidatePath("/dashboard/library");
  revalidatePath("/product/ebooks-and-guides");
  revalidatePath("/admin/content");
  revalidatePath("/dashboard/billing");
  return { ok: true };
}
