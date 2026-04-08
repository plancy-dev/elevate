import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { normalizePurchaseAllowlistEmail } from "@/lib/payments/purchase-allowlist";

type AdminClient = SupabaseClient<Database>;

/**
 * Returns whether the normalized email has a row in `prompt_studio_beta_allowlist`.
 * Call with service-role client (table has no public RLS policies).
 */
export async function isEmailOnPromptStudioBetaAllowlist(
  admin: AdminClient,
  emailNormalized: string,
): Promise<boolean> {
  const { data, error } = await admin
    .from("prompt_studio_beta_allowlist")
    .select("id")
    .eq("email_normalized", emailNormalized)
    .maybeSingle();

  if (error) throw error;
  return data != null;
}

export function normalizeStudioBetaEmail(email: string): string {
  return normalizePurchaseAllowlistEmail(email);
}
