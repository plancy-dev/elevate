import { describe, expect, it } from "vitest";
import {
  draftArtifactSyncKey,
  draftTripleFromArtifactTimestamps,
  draftTripleFromArtifacts,
} from "@/lib/studio-productions/resolve-episode-draft-artifacts";
import type { StudioProductionArtifactRow } from "@/lib/data/studio-productions";

function row(
  overrides: Partial<StudioProductionArtifactRow> &
    Pick<StudioProductionArtifactRow, "artifact_role" | "content_text" | "created_at">,
): StudioProductionArtifactRow {
  return {
    id: overrides.id ?? "00000000-0000-4000-8000-000000000001",
    organization_id: overrides.organization_id ?? "00000000-0000-4000-8000-000000000002",
    episode_id: overrides.episode_id ?? "00000000-0000-4000-8000-000000000003",
    artifact_role: overrides.artifact_role,
    tool_platform: overrides.tool_platform ?? "other",
    content_text: overrides.content_text,
    metadata: overrides.metadata ?? null,
    sort_order: overrides.sort_order ?? 0,
    external_url: overrides.external_url ?? null,
    created_at: overrides.created_at,
  };
}

describe("draftTripleFromArtifacts", () => {
  it("picks the latest row per role when multiple hook rows exist", () => {
    const artifacts = [
      row({
        id: "11111111-1111-4111-8111-111111111111",
        artifact_role: "hook",
        content_text: "stale office worker hook",
        created_at: "2026-04-10T10:00:00.000Z",
      }),
      row({
        id: "22222222-2222-4222-8222-222222222222",
        artifact_role: "hook",
        content_text: "fresh military hook",
        created_at: "2026-04-15T11:00:00.000Z",
      }),
      row({
        id: "33333333-3333-4333-8333-333333333333",
        artifact_role: "title",
        content_text: "title new",
        created_at: "2026-04-15T11:00:01.000Z",
      }),
      row({
        id: "44444444-4444-4444-8444-444444444444",
        artifact_role: "script_draft",
        content_text: "script new",
        created_at: "2026-04-15T11:00:02.000Z",
      }),
    ];
    const d = draftTripleFromArtifacts(artifacts);
    expect(d.hook).toBe("fresh military hook");
    expect(d.title).toBe("title new");
    expect(d.script_draft).toBe("script new");
  });
});

describe("draftTripleFromArtifactTimestamps", () => {
  it("matches latest-per-role resolution for server-shaped rows", () => {
    const out = draftTripleFromArtifactTimestamps([
      { artifact_role: "hook", content_text: "a", created_at: "2026-01-01T00:00:00.000Z" },
      { artifact_role: "hook", content_text: "b", created_at: "2026-01-02T00:00:00.000Z" },
      { artifact_role: "title", content_text: "t", created_at: "2026-01-02T00:00:00.000Z" },
      { artifact_role: "script_draft", content_text: "s", created_at: "2026-01-02T00:00:00.000Z" },
    ]);
    expect(out.hook).toBe("b");
    expect(out.title).toBe("t");
    expect(out.script_draft).toBe("s");
  });
});

describe("draftArtifactSyncKey", () => {
  it("keys off latest rows so superseded duplicates do not look like no-op sync", () => {
    const a = row({
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      artifact_role: "hook",
      content_text: "old",
      created_at: "2026-04-10T10:00:00.000Z",
    });
    const b = row({
      id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      artifact_role: "hook",
      content_text: "new",
      created_at: "2026-04-15T11:00:00.000Z",
    });
    const k1 = draftArtifactSyncKey([a]);
    const k2 = draftArtifactSyncKey([a, b]);
    expect(k1).not.toBe(k2);
    expect(k2).toContain("bbbbbbbb");
  });
});
