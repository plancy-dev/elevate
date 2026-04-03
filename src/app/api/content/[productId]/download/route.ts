import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getContentStorageBucket } from "@/lib/env/content-storage";
import { canReadCatalogProduct } from "@/lib/content/ebook-access";
import { getOrganizationCatalogAccess } from "@/lib/data/organization-catalog-access";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Redirects to a short-lived signed URL when the org may read the SKU
 * (`canReadCatalogProduct`), `delivery_mode` is `pdf`, and
 * `storage_object_path` is set. `web_only` products return 403.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  const { productId } = await params;
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
    .select("storage_object_path, delivery_mode")
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

  const { data: signed, error: se } = await admin.storage
    .from(bucket)
    .createSignedUrl(path, 120);

  if (se || !signed?.signedUrl) {
    return NextResponse.json({ error: "could not sign url" }, { status: 502 });
  }

  return NextResponse.redirect(signed.signedUrl);
}
