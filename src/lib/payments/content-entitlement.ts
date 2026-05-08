import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import type { Database } from "@/types/database.types";

type AdminClient = SupabaseClient<Database>;

/**
 * Inserts org entitlement for a content product (idempotent).
 * Call after hosted checkout (e.g. Lemon) confirms purchase for a catalog product.
 */
export async function grantOrganizationContentEntitlement(
  admin: AdminClient,
  organizationId: string,
  contentProductId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await admin.from("organization_content_entitlements").insert({
    organization_id: organizationId,
    content_product_id: contentProductId,
  });

  if (error) {
    if (error.code === "23505") {
      revalidatePath("/dashboard/library");
      return { ok: true };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard/library");
  return { ok: true };
}
