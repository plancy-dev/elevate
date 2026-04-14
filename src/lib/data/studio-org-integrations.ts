import type { SupabaseClient } from "@supabase/supabase-js";

export type StudioOrgProviderConnectionMeta = {
  provider: string;
  last_verified_at: string | null;
  updated_at: string;
};

/** Metadata only — never returns `secret_ciphertext`. */
export async function listStudioOrgProviderConnectionsMeta(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<StudioOrgProviderConnectionMeta[]> {
  const { data, error } = await supabase
    .from("studio_org_provider_connections")
    .select("provider, last_verified_at, updated_at")
    .eq("organization_id", organizationId)
    .order("provider", { ascending: true });

  if (error || !data) return [];
  return data as StudioOrgProviderConnectionMeta[];
}
