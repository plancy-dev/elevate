import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database.types";
import { isMissingSchemaRelationError } from "@/lib/supabase/postgrest-relation-missing";
import { EPISODE_DRAFT_ROLES } from "@/lib/studio-productions/constants";
import { draftArtifactMetadata } from "@/lib/studio-productions/episode-llm";

export type DraftSnapshotSource =
  | "llm_generate"
  | "llm_refine"
  | "user_save"
  | "restore"
  | "superseded";

export type StudioEpisodeDraftSnapshotRow =
  Database["public"]["Tables"]["studio_episode_draft_snapshots"]["Row"];

export type DraftTriple = {
  hook: string;
  title: string;
  script_draft: string;
};

/** Unify CRLF/LF and trim so LLM payloads match FormData / DB round-trips for dedup. */
export function normalizeDraftTripleForSnapshot(p: DraftTriple): DraftTriple {
  const nl = (s: string) => s.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  return {
    hook: nl(p.hook ?? "").trim(),
    title: nl(p.title ?? "").trim(),
    script_draft: nl(p.script_draft ?? "").trim(),
  };
}

function fingerprint(p: DraftTriple): string {
  const n = normalizeDraftTripleForSnapshot(p);
  return `${n.hook}\u0000${n.title}\u0000${n.script_draft}`;
}

/** Prior live draft before AI replaces artifacts — skip if empty or identical to next. */
export function shouldArchiveSupersededDraft(
  prior: DraftTriple,
  next: DraftTriple,
): boolean {
  const p = normalizeDraftTripleForSnapshot(prior);
  const n = normalizeDraftTripleForSnapshot(next);
  const empty = !p.hook && !p.title && !p.script_draft;
  if (empty) return false;
  return fingerprint(p) !== fingerprint(n);
}

/**
 * Writes hook / title / script_draft to the latest row per role (same logic as manual save).
 */
export async function upsertEpisodeDraftArtifactsFromPayload(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  episodeId: string,
  payload: DraftTriple,
): Promise<void> {
  const metaUser = draftArtifactMetadata("user");
  const texts: Record<(typeof EPISODE_DRAFT_ROLES)[number], string> = {
    hook: payload.hook,
    title: payload.title,
    script_draft: payload.script_draft,
  };

  for (let i = 0; i < EPISODE_DRAFT_ROLES.length; i++) {
    const role = EPISODE_DRAFT_ROLES[i];
    const text = texts[role];
    const sortOrder = i;

    const { data: row } = await supabase
      .from("studio_production_artifacts")
      .select("id")
      .eq("episode_id", episodeId)
      .eq("organization_id", organizationId)
      .eq("artifact_role", role)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (row?.id) {
      const { error } = await supabase
        .from("studio_production_artifacts")
        .update({
          content_text: text,
          metadata: metaUser,
        })
        .eq("id", row.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("studio_production_artifacts").insert({
        organization_id: organizationId,
        episode_id: episodeId,
        artifact_role: role,
        tool_platform: "other",
        content_text: text,
        metadata: metaUser,
        sort_order: sortOrder,
      });
      if (error) throw error;
    }
  }
}

/**
 * Inserts an immutable snapshot unless it is identical to the latest snapshot for this episode.
 * Use `skipDedup: true` for restore actions so each restore is recorded.
 */
export async function insertDraftSnapshotIfChanged(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  episodeId: string,
  payload: DraftTriple,
  source: DraftSnapshotSource,
  metadata: Json = {},
  options?: { skipDedup?: boolean },
): Promise<{ skipped: boolean }> {
  const payloadNorm = normalizeDraftTripleForSnapshot(payload);

  if (!options?.skipDedup) {
    const { data: lastRows } = await supabase
      .from("studio_episode_draft_snapshots")
      .select("hook, title, script_draft")
      .eq("episode_id", episodeId)
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(1);

    const last = lastRows?.[0];
    if (last) {
      const same =
        fingerprint({
          hook: last.hook ?? "",
          title: last.title ?? "",
          script_draft: last.script_draft ?? "",
        }) === fingerprint(payloadNorm);
      if (same) return { skipped: true };
    }
  }

  const { error } = await supabase.from("studio_episode_draft_snapshots").insert({
    organization_id: organizationId,
    episode_id: episodeId,
    source,
    hook: payloadNorm.hook,
    title: payloadNorm.title,
    script_draft: payloadNorm.script_draft,
    metadata,
  });
  if (error) throw error;
  return { skipped: false };
}

export async function listDraftSnapshotsForEpisode(
  supabase: SupabaseClient<Database>,
  episodeId: string,
  organizationId: string,
  limit = 30,
): Promise<StudioEpisodeDraftSnapshotRow[]> {
  const { data, error } = await supabase
    .from("studio_episode_draft_snapshots")
    .select("*")
    .eq("episode_id", episodeId)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit);

  if (error) {
    if (isMissingSchemaRelationError(error)) return [];
    throw error;
  }
  return data ?? [];
}

export async function getDraftSnapshotForOrg(
  supabase: SupabaseClient<Database>,
  snapshotId: string,
  episodeId: string,
  organizationId: string,
): Promise<StudioEpisodeDraftSnapshotRow | null> {
  const { data, error } = await supabase
    .from("studio_episode_draft_snapshots")
    .select("*")
    .eq("id", snapshotId)
    .eq("episode_id", episodeId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) throw error;
  return data;
}
