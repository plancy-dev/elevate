import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export type StudioEpisodeDraftTemplateRow = {
  id: string;
  name: string;
  bias_body: string;
  updated_at: string;
};

export async function listDraftTemplatesForOrg(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<StudioEpisodeDraftTemplateRow[]> {
  const { data, error } = await supabase
    .from("studio_episode_draft_templates")
    .select("id, name, bias_body, updated_at")
    .eq("organization_id", organizationId)
    .order("name", { ascending: true });

  if (error) return [];
  return (data ?? []) as StudioEpisodeDraftTemplateRow[];
}
