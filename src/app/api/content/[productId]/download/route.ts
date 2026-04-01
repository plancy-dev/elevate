import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getContentStorageBucket } from "@/lib/env/content-storage";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Redirects to a short-lived signed URL if the user is entitled to the product
 * and `content_products.storage_object_path` is set.
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .maybeSingle();

  const orgId = profile?.organization_id;
  if (!orgId) {
    return NextResponse.json({ error: "no organization" }, { status: 403 });
  }

  const { data: ent } = await supabase
    .from("organization_content_entitlements")
    .select("id")
    .eq("organization_id", orgId)
    .eq("content_product_id", productId)
    .maybeSingle();

  if (!ent) {
    return NextResponse.json({ error: "not entitled" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: product, error: pe } = await admin
    .from("content_products")
    .select("storage_object_path")
    .eq("id", productId)
    .maybeSingle();

  if (pe || !product?.storage_object_path?.trim()) {
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
