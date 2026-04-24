/**
 * Resolve the effective Buffer API key for an organization.
 *
 * Priority:
 *   1. Per-org row in `studio_org_provider_connections` (provider = 'buffer')
 *      — allows multi-tenant SaaS mode once org-scoped Buffer accounts exist.
 *   2. Env fallback `BUFFER_API_KEY` — the simple single-tenant mode the
 *      product ships with today.
 *
 * Returns `null` when neither source is configured.
 */
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { getOrgProviderApiKey } from "@/lib/studio-integrations/org-provider-secret";

export async function resolveBufferApiKey(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<string | null> {
  const fromOrg = await getOrgProviderApiKey(supabase, organizationId, "buffer");
  if (fromOrg) return fromOrg;
  const fromEnv = (process.env.BUFFER_API_KEY ?? "").replace(/\s+/g, "").trim();
  return fromEnv.length > 0 ? fromEnv : null;
}
