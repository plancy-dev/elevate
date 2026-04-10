import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getContentStorageBucket } from "@/lib/env/content-storage";
import { canReadCatalogProduct } from "@/lib/content/ebook-access";
import { getOrganizationCatalogAccess } from "@/lib/data/organization-catalog-access";
import {
  downloadFilenameFromStoragePath,
  normalizeOriginalFileNameForDb,
} from "@/lib/content/storage-filename";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Redirects to a short-lived signed URL when the org may read the SKU
 * (`canReadCatalogProduct`), `delivery_mode` is `pdf`, and
 * `storage_object_path` is set. `web_only` products return 403.
 *
 * Query: `disposition=inline` (or `open=1`) opens in the browser; default and
 * `disposition=attachment` use Supabase `download` so PDFs save instead of
 * navigating inline.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  const { productId } = await params;
  const url = new URL(req.url);
  const inline =
    url.searchParams.get("disposition") === "inline" ||
    url.searchParams.get("open") === "1";
  if (!UUID_RE.test(productId)) {
    return NextResponse.json({ error: "invalid product id" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const access = await getOrganizationCatalogAccess(supabase, user.id);
  if (!access) {
    return NextResponse.json({ error: "no organization" }, { status: 403 });
  }

  if (
    !canReadCatalogProduct({
      organizationPlan: access.organizationPlan,
      entitledProductIds: access.entitledProductIds,
      productId,
    })
  ) {
    return NextResponse.json({ error: "not entitled" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: product, error: pe } = await admin
    .from("content_products")
    .select("storage_object_path, delivery_mode, original_file_name")
    .eq("id", productId)
    .maybeSingle();

  if (pe || !product) {
    return NextResponse.json({ error: "file not available" }, { status: 404 });
  }

  if (product.delivery_mode === "web_only") {
    return NextResponse.json(
      { error: "downloads not available for this product" },
      { status: 403 },
    );
  }

  if (!product.storage_object_path?.trim()) {
    return NextResponse.json({ error: "file not available" }, { status: 404 });
  }

  const bucket = getContentStorageBucket();
  const path = product.storage_object_path.trim();

  const filename = product.original_file_name?.trim()
    ? normalizeOriginalFileNameForDb(product.original_file_name)
    : downloadFilenameFromStoragePath(path);
  const signOptions = inline
    ? undefined
    : ({ download: filename } satisfies { download: string });

  const { data: signed, error: se } = await admin.storage
    .from(bucket)
    .createSignedUrl(path, 120, signOptions);

  if (se || !signed?.signedUrl) {
    return NextResponse.json({ error: "could not sign url" }, { status: 502 });
  }

  return NextResponse.redirect(signed.signedUrl);
}
