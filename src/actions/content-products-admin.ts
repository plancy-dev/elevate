"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { canAccessPlatformAdmin } from "@/lib/auth/platform-admin";
import { getContentStorageBucket } from "@/lib/env/content-storage";
import { TOSS_POC_AMOUNT_KRW } from "@/lib/payments/toss-poc";

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

  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!canAccessPlatformAdmin(user.email, prof?.role)) {
    return { ok: false, error: "forbidden" };
  }
  return { ok: true };
}

export type UploadContentProductResult =
  | { ok: true; replaced: boolean }
  | { ok: false; error: string };

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
    priceKrw = TOSS_POC_AMOUNT_KRW;
  }
  const priceCents = priceKrw * 100;

  const safeBase = originalName.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120);
  const storagePath = `ebooks/${slug}/${Date.now()}-${safeBase}`;

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
