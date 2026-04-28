/**
 * Normalizes `reference_source` artifacts for read-only display on the production
 * pipeline tab (INIT/input sources: links, pasted text, notes). Same metadata
 * keys as {@link ProductionEpisodeReferencePanel}.
 */
import type { StudioProductionArtifactRow } from "@/lib/data/studio-productions";
import type { ReferenceSourceType } from "@/lib/studio-productions/reference-source";

const REF_ROLE = "reference_source";
const PREVIEW_CHARS = 220;

export type PipelineReferenceSourceItem = {
  id: string;
  sortOrder: number;
  sourceType: ReferenceSourceType | "unknown";
  /** `metadata.source_label` or fallback. */
  label: string;
  /** First line / snippet of `content_text` for UI preview. */
  contentPreview: string | null;
  /** `external_url` when present (e.g. future file URLs). */
  href: string | null;
};

function parseSourceType(raw: unknown): ReferenceSourceType | "unknown" {
  if (raw === "youtube_url" || raw === "web_url" || raw === "text" || raw === "manual_note") {
    return raw;
  }
  return "unknown";
}

function trimPreview(text: string): string {
  const t = text.trim().replace(/\s+/g, "");
  if (t.length <= PREVIEW_CHARS) return t;
  return `${t.slice(0, PREVIEW_CHARS)}…`;
}

/**
 * Returns `reference_source` rows in the same order as `artifacts` (caller
 * should pass episode artifacts already sorted by `sort_order`, `created_at`).
 */
export function listPipelineReferenceSources(
  artifacts: StudioProductionArtifactRow[],
): PipelineReferenceSourceItem[] {
  const out: PipelineReferenceSourceItem[] = [];
  for (const a of artifacts) {
    if (a.artifact_role !== REF_ROLE) continue;
    const meta = (a.metadata ?? {}) as Record<string, unknown>;
    const label =
      typeof meta.source_label === "string" && meta.source_label.trim()
        ? meta.source_label.trim()
        : a.artifact_role;
    const content = a.content_text?.trim() ?? "";
    const href =
      typeof a.external_url === "string" && a.external_url.trim()
        ? a.external_url.trim()
        : null;
    out.push({
      id: a.id,
      sortOrder: a.sort_order ?? 0,
      sourceType: parseSourceType(meta.source_type),
      label,
      contentPreview: content ? trimPreview(content) : null,
      href,
    });
  }
  return out;
}

export function hasPipelineReferenceSources(artifacts: StudioProductionArtifactRow[]): boolean {
  return listPipelineReferenceSources(artifacts).length > 0;
}
