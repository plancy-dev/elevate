import { describe, expect, it } from "vitest";
import {
  hasPipelineReferenceSources,
  listPipelineReferenceSources,
} from "@/lib/studio-productions/pipeline-reference-context";
import type { StudioProductionArtifactRow } from "@/lib/data/studio-productions";

function row(
  partial: Partial<StudioProductionArtifactRow> & Pick<StudioProductionArtifactRow, "id">,
): StudioProductionArtifactRow {
  return {
    artifact_role: "reference_source",
    content_text: null,
    created_at: "2026-01-01T00:00:00Z",
    episode_id: "e1",
    external_url: null,
    metadata: null,
    organization_id: "o1",
    sort_order: 0,
    tool_platform: null,
    updated_at: "2026-01-01T00:00:00Z",
    ...partial,
  } as StudioProductionArtifactRow;
}

describe("listPipelineReferenceSources", () => {
  it("maps reference_source rows with metadata", () => {
    const artifacts = [
      row({
        id: "a1",
        sort_order: 1,
        metadata: { source_type: "youtube_url", source_label: "https://youtu.be/x" },
        content_text: "Transcript line one.\nLine two.",
      }),
      row({
        id: "a2",
        artifact_role: "script_draft",
        metadata: {},
      }),
    ];
    const list = listPipelineReferenceSources(artifacts);
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({
      id: "a1",
      sourceType: "youtube_url",
      label: "https://youtu.be/x",
      href: null,
    });
    expect(list[0]?.contentPreview).toContain("Transcript");
  });

  it("uses external_url as href when set", () => {
    const list = listPipelineReferenceSources([
      row({
        id: "a1",
        external_url: "https://storage.example.com/f.pdf",
        metadata: { source_type: "web_url", source_label: "Doc" },
      }),
    ]);
    expect(list[0]?.href).toBe("https://storage.example.com/f.pdf");
  });

  it("returns empty when no reference_source", () => {
    expect(listPipelineReferenceSources([row({ id: "x", artifact_role: "tts_audio" })])).toEqual(
      [],
    );
    expect(hasPipelineReferenceSources([row({ id: "x", artifact_role: "tts_audio" })])).toBe(
      false,
    );
  });
});
