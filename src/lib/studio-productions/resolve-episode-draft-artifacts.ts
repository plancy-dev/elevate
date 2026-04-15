import type { StudioProductionArtifactRow } from "@/lib/data/studio-productions";
import { EPISODE_DRAFT_ROLES, type EpisodeDraftRole } from "@/lib/studio-productions/constants";

/** Same shape as `LlmDraftPayload` / `StudioEpisodeLlmDraftPayload` (avoid importing episode-llm here). */
export type EpisodeDraftTriple = {
  hook: string;
  title: string;
  script_draft: string;
};

/**
 * Episode draft fields may exist as multiple rows per role (e.g. manual save updates one row
 * while LLM generate deletes `metadata.source=llm` rows and inserts new ones). List queries
 * order oldest-first, so `.find(role)` picks stale text. Always resolve by latest `created_at`.
 */
function isNewer(
  a: Pick<StudioProductionArtifactRow, "created_at">,
  b: Pick<StudioProductionArtifactRow, "created_at">,
): boolean {
  return new Date(a.created_at).getTime() > new Date(b.created_at).getTime();
}

export function pickLatestDraftArtifactRows(
  artifacts: StudioProductionArtifactRow[],
): Map<EpisodeDraftRole, StudioProductionArtifactRow> {
  const map = new Map<EpisodeDraftRole, StudioProductionArtifactRow>();
  for (const a of artifacts) {
    if (!EPISODE_DRAFT_ROLES.includes(a.artifact_role as EpisodeDraftRole)) continue;
    const role = a.artifact_role as EpisodeDraftRole;
    const prev = map.get(role);
    if (!prev || isNewer(a, prev)) map.set(role, a);
  }
  return map;
}

export function draftTripleFromArtifacts(artifacts: StudioProductionArtifactRow[]): EpisodeDraftTriple {
  const latest = pickLatestDraftArtifactRows(artifacts);
  return {
    hook: latest.get("hook")?.content_text ?? "",
    title: latest.get("title")?.content_text ?? "",
    script_draft: latest.get("script_draft")?.content_text ?? "",
  };
}

export function draftArtifactSyncKey(artifacts: StudioProductionArtifactRow[]): string {
  const latest = pickLatestDraftArtifactRows(artifacts);
  return EPISODE_DRAFT_ROLES.map((role) => {
    const row = latest.get(role);
    return row ? `${row.id}:${row.created_at}` : `_:${role}`;
  }).join("|");
}

/** Same resolution as {@link draftTripleFromArtifacts} for minimal server selects (no id needed). */
export function draftTripleFromArtifactTimestamps(
  rows: { artifact_role: string; content_text: string | null; created_at: string }[],
): EpisodeDraftTriple {
  const map = new Map<
    EpisodeDraftRole,
    { artifact_role: string; content_text: string | null; created_at: string }
  >();
  for (const r of rows) {
    if (!EPISODE_DRAFT_ROLES.includes(r.artifact_role as EpisodeDraftRole)) continue;
    const role = r.artifact_role as EpisodeDraftRole;
    const prev = map.get(role);
    if (!prev || new Date(r.created_at).getTime() > new Date(prev.created_at).getTime()) {
      map.set(role, r);
    }
  }
  return {
    hook: map.get("hook")?.content_text ?? "",
    title: map.get("title")?.content_text ?? "",
    script_draft: map.get("script_draft")?.content_text ?? "",
  };
}
