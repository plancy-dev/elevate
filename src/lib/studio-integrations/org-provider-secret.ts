/**
 * Decrypt org-stored provider API keys (server-only).
 */
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { decryptProviderSecret } from "@/lib/studio-integrations/crypto";
import type { StudioIntegrationProviderId } from "@/lib/studio-integrations/types";

export async function getOrgProviderApiKey(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  provider: StudioIntegrationProviderId,
): Promise<string | null> {
  const { data: row, error } = await supabase
    .from("studio_org_provider_connections")
    .select("secret_ciphertext")
    .eq("organization_id", organizationId)
    .eq("provider", provider)
    .maybeSingle();

  if (error || !row?.secret_ciphertext) return null;
  try {
    const apiKey = decryptProviderSecret(row.secret_ciphertext);
    const t = apiKey.replace(/\s+/g, "").trim();
    return t.length > 0 ? t : null;
  } catch {
    return null;
  }
}
