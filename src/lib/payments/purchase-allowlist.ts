import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export function normalizePurchaseAllowlistEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Returns whether the normalized email has a row in `catalog_purchase_allowlist`.
 * Call with service-role client (table has no public RLS policies).
 */
export async function isEmailOnCatalogPurchaseAllowlist(
  admin: SupabaseClient<Database>,
  emailNormalized: string,
): Promise<boolean> {
  const { data, error } = await admin
    .from("catalog_purchase_allowlist")
    .select("id")
    .eq("email_normalized", emailNormalized)
    .maybeSingle();

  if (error) throw error;
  return data != null;
}
