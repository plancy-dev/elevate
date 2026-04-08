import type { SupabaseClient } from "@supabase/supabase-js";
import { listStudioEpisodesForOrg } from "@/lib/data/studio-productions";
import { getDemoEpisodesForOrgSeed } from "@/lib/studio-productions/demo-sample-data";
import type { Database, Json } from "@/types/database.types";

export type InsertDemoSeedResult =
  | { ok: true; episodeCount: number; artifactCount: number }
  | { ok: false; reason: "not_empty" | "db" };

/**
 * Inserts demo episodes + artifacts for an org (same payload as the dashboard seed button).
 * Use with a Supabase client that can write these rows (user session or service role).
 */
export async function insertDemoStudioSeedForOrg(
  supabase: SupabaseClient<Database>,
  params: {
    organizationId: string;
    createdBy: string | null;
    /** When false, inserts even if the org already has episodes (CLI / repeat runs). Default true. */
    requireEmpty?: boolean;
  },
): Promise<InsertDemoSeedResult> {
  const requireEmpty = params.requireEmpty !== false;

  if (requireEmpty) {
    const existing = await listStudioEpisodesForOrg(
      supabase,
      params.organizationId,
    );
    if (existing.length > 0) {
      return { ok: false, reason: "not_empty" };
    }
  }

  const demos = getDemoEpisodesForOrgSeed();
  const now = new Date().toISOString();

  const episodeRows = demos.map((d) => ({
    organization_id: params.organizationId,
    title: d.title,
    status: d.status,
    publish_url: d.publish_url,
    distribution_label: d.distribution_label,
    notes: d.notes,
    created_by: params.createdBy,
    updated_at: now,
  }));

  const { data: inserted, error: epError } = await supabase
    .from("studio_production_episodes")
    .insert(episodeRows)
    .select("id");

  if (epError || !inserted?.length || inserted.length !== demos.length) {
    return { ok: false, reason: "db" };
  }

  const artifactRows: {
    organization_id: string;
    episode_id: string;
    artifact_role: string;
    tool_platform: string;
    content_text: string;
    external_url: string | null;
    metadata: Json;
    sort_order: number;
  }[] = [];

  for (let i = 0; i < demos.length; i++) {
    const episodeId = inserted[i]?.id;
    if (!episodeId) {
      return { ok: false, reason: "db" };
    }
    for (const a of demos[i].artifacts) {
      artifactRows.push({
        organization_id: params.organizationId,
        episode_id: episodeId,
        artifact_role: a.artifact_role,
        tool_platform: a.tool_platform,
        content_text: a.content_text,
        external_url: a.external_url,
        metadata: a.metadata,
        sort_order: a.sort_order,
      });
    }
  }

  const { error: artError } = await supabase
    .from("studio_production_artifacts")
    .insert(artifactRows);

  if (artError) {
    return { ok: false, reason: "db" };
  }

  return {
    ok: true,
    episodeCount: demos.length,
    artifactCount: artifactRows.length,
  };
}
