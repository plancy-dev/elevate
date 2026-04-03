import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { OrgPlan } from "@/lib/organizations/plan";

export type OrganizationCatalogAccess = {
  orgId: string;
  organizationPlan: OrgPlan | null;
  entitledProductIds: Set<string>;
};

/**
 * Loads org + plan + all catalog entitlement IDs for Library / download / reader.
 * Returns null when the user has no organization (cannot use catalog flows).
 */
export async function getOrganizationCatalogAccess(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<OrganizationCatalogAccess | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", userId)
    .maybeSingle();

  const orgId = profile?.organization_id;
  if (!orgId) return null;

  const { data: org } = await supabase
    .from("organizations")
    .select("plan")
    .eq("id", orgId)
    .maybeSingle();

  const { data: ents, error } = await supabase
    .from("organization_content_entitlements")
    .select("content_product_id")
    .eq("organization_id", orgId);

  if (error) throw error;

  const entitledProductIds = new Set(
    (ents ?? []).map((e) => e.content_product_id),
  );

  return {
    orgId,
    organizationPlan: org?.plan ?? null,
    entitledProductIds,
  };
}
