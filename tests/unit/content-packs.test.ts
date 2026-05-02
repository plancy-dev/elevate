import { describe, expect, it } from "vitest";
import {
  ACTIVE_CONTENT_PACK_VERSION,
  buildDraftsFromActivePacks,
  resolveActiveContentPacks,
} from "@/lib/content-ops/packs/pack-registry";

describe("content ops pack registry", () => {
  it("resolves active versions and topic strategy", () => {
    const resolved = resolveActiveContentPacks(new Date("2026-05-01T00:00:00.000Z"));
    expect(resolved.activeVersion).toBe(ACTIVE_CONTENT_PACK_VERSION);
    expect(resolved.versions.blogPrompt).toMatch(/^v/);
    expect(resolved.topic.id.length).toBeGreaterThan(0);
    expect(["novelty_boost", "overcopy_mitigate", "balanced"]).toContain(
      resolved.autotune.strategy,
    );
  });

  it("builds newsletter and blog drafts with source section", () => {
    const drafts = buildDraftsFromActivePacks({
      sourceBullets: ["1. [Alpha](https://example.com/a)", "2. [Beta](https://example.com/b)"],
      date: new Date("2026-05-01T00:00:00.000Z"),
    });
    expect(drafts.newsletter.bodyMarkdown).toContain("## Sources");
    expect(drafts.newsletter.bodyMarkdown).toContain("[Alpha]");
    expect(drafts.newsletter.bodyMarkdown).toContain("## Evidence snapshot");
    expect(drafts.newsletter.bodyMarkdown).toContain("## Autotune strategy");
    expect(drafts.blog.bodyMarkdown).toContain("## Execution checklist (this week)");
    expect(drafts.blog.bodyMarkdown).toContain("## Evidence ladder");
    expect(drafts.blog.bodyMarkdown).toContain("## Autotune strategy");
    expect(drafts.blog.title.length).toBeGreaterThan(20);
  });

  it("records deterministic weekday strategy selection", () => {
    const monday = resolveActiveContentPacks(new Date("2026-05-04T00:00:00.000Z"));
    const tuesday = resolveActiveContentPacks(new Date("2026-05-05T00:00:00.000Z"));
    const sunday = resolveActiveContentPacks(new Date("2026-05-03T00:00:00.000Z"));
    expect(monday.autotune.strategy).toBe("novelty_boost");
    expect(tuesday.autotune.strategy).toBe("overcopy_mitigate");
    expect(sunday.autotune.strategy).toBe("balanced");
    expect(monday.autotune.selection).toBe("weekday_contract_v1");
  });
});
