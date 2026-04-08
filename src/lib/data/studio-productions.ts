import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export type StudioProductionEpisodeRow =
  Database["public"]["Tables"]["studio_production_episodes"]["Row"];
export type StudioProductionArtifactRow =
  Database["public"]["Tables"]["studio_production_artifacts"]["Row"];

export async function listStudioEpisodesForOrg(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<StudioProductionEpisodeRow[]> {
  const { data, error } = await supabase
    .from("studio_production_episodes")
    .select("*")
    .eq("organization_id", organizationId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as StudioProductionEpisodeRow[];
}

export async function getStudioEpisodeForOrg(
  supabase: SupabaseClient<Database>,
  episodeId: string,
  organizationId: string,
): Promise<StudioProductionEpisodeRow | null> {
  const { data, error } = await supabase
    .from("studio_production_episodes")
    .select("*")
    .eq("id", episodeId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) throw error;
  return data as StudioProductionEpisodeRow | null;
}

export async function listStudioArtifactsForEpisode(
  supabase: SupabaseClient<Database>,
  episodeId: string,
  organizationId: string,
): Promise<StudioProductionArtifactRow[]> {
  const { data, error } = await supabase
    .from("studio_production_artifacts")
    .select("*")
    .eq("episode_id", episodeId)
    .eq("organization_id", organizationId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as StudioProductionArtifactRow[];
}
