import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database.types";

export type StudioProductionEpisodeRow =
  Database["public"]["Tables"]["studio_production_episodes"]["Row"];
export type StudioProductionArtifactRow =
  Database["public"]["Tables"]["studio_production_artifacts"]["Row"];

/** Nested rows from FK embeds (Supabase select). */
export type StudioEpisodeEmbeddedRelations = {
  studio_niches: { id: string; display_name: string } | null;
  studio_format_templates: { id: string; display_name: string } | null;
  studio_distribution_channels: {
    id: string;
    label: string;
    channel_url: string;
    platform: string;
    metadata: Json | null;
  } | null;
};

export type StudioProductionEpisodeRowWithEmbeds = StudioProductionEpisodeRow &
  StudioEpisodeEmbeddedRelations;

export async function listStudioEpisodesForOrg(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  opts?: { distributionChannelId?: string | null },
): Promise<StudioProductionEpisodeRowWithEmbeds[]> {
  let q = supabase
    .from("studio_production_episodes")
    .select(
      `
      *,
      studio_niches ( id, display_name ),
      studio_format_templates ( id, display_name ),
      studio_distribution_channels ( id, label, channel_url, platform, metadata )
    `,
    )
    .eq("organization_id", organizationId);

  if (opts?.distributionChannelId) {
    q = q.eq("studio_distribution_channel_id", opts.distributionChannelId);
  }

  const { data, error } = await q.order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as StudioProductionEpisodeRowWithEmbeds[];
}

export async function getStudioEpisodeForOrg(
  supabase: SupabaseClient<Database>,
  episodeId: string,
  organizationId: string,
): Promise<StudioProductionEpisodeRowWithEmbeds | null> {
  const { data, error } = await supabase
    .from("studio_production_episodes")
    .select(
      `
      *,
      studio_niches ( id, display_name ),
      studio_format_templates ( id, display_name ),
      studio_distribution_channels ( id, label, channel_url, platform, metadata )
    `,
    )
    .eq("id", episodeId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) throw error;
  return data as StudioProductionEpisodeRowWithEmbeds | null;
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
