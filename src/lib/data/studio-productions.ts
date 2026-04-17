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
  studio_projects: { id: string; name: string; brand_guide: string } | null;
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
  opts?: {
    distributionChannelId?: string | null;
    projectId?: string | null;
    /** Episodes with no project (project_id IS NULL). Mutually exclusive with projectId. */
    unassignedOnly?: boolean;
  },
): Promise<StudioProductionEpisodeRowWithEmbeds[]> {
  let q = supabase
    .from("studio_production_episodes")
    .select(
      `
      *,
      studio_niches ( id, display_name ),
      studio_format_templates ( id, display_name ),
      studio_projects ( id, name, brand_guide ),
      studio_distribution_channels ( id, label, channel_url, platform, metadata )
    `,
    )
    .eq("organization_id", organizationId);

  if (opts?.unassignedOnly) {
    q = q.is("project_id", null);
  } else if (opts?.projectId) {
    q = q.eq("project_id", opts.projectId);
  }

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
      studio_projects ( id, name, brand_guide ),
      studio_distribution_channels ( id, label, channel_url, platform, metadata )
    `,
    )
    .eq("id", episodeId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) throw error;
  return data as StudioProductionEpisodeRowWithEmbeds | null;
}

/** Total episode rows for org with optional channel and/or project filters. */
export async function countStudioEpisodesForOrg(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  opts?: {
    distributionChannelId?: string | null;
    projectId?: string | null;
    unassignedOnly?: boolean;
  },
): Promise<number> {
  let q = supabase
    .from("studio_production_episodes")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  if (opts?.unassignedOnly) {
    q = q.is("project_id", null);
  } else if (opts?.projectId) {
    q = q.eq("project_id", opts.projectId);
  }
  if (opts?.distributionChannelId) {
    q = q.eq("studio_distribution_channel_id", opts.distributionChannelId);
  }

  const { count, error } = await q;
  if (error) throw error;
  return count ?? 0;
}

/**
 * Episode counts per project id (only rows with non-null project_id).
 * Optional channel filter matches `listStudioEpisodesForOrg`.
 */
export async function countStudioEpisodesByProjectForOrg(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  opts?: { distributionChannelId?: string | null },
): Promise<Record<string, number>> {
  let q = supabase
    .from("studio_production_episodes")
    .select("project_id")
    .eq("organization_id", organizationId);

  if (opts?.distributionChannelId) {
    q = q.eq("studio_distribution_channel_id", opts.distributionChannelId);
  }

  const { data, error } = await q;
  if (error) throw error;

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const pid = row.project_id;
    if (!pid) continue;
    counts[pid] = (counts[pid] ?? 0) + 1;
  }
  return counts;
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
