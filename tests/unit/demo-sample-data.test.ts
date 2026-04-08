import { describe, expect, it } from "vitest";
import { getDemoEpisodesForOrgSeed } from "@/lib/studio-productions/demo-sample-data";

describe("demo-sample-data", () => {
  it("exports three episodes with artifacts", () => {
    const episodes = getDemoEpisodesForOrgSeed();
    expect(episodes).toHaveLength(3);
    expect(episodes[0]?.status).toBe("draft");
    expect(episodes[1]?.status).toBe("ready");
    expect(episodes[2]?.status).toBe("published");
    const totalArtifacts = episodes.reduce((n, e) => n + e.artifacts.length, 0);
    expect(totalArtifacts).toBeGreaterThan(5);
    expect(episodes.every((e) => e.title.startsWith("[데모]"))).toBe(true);
  });
});
