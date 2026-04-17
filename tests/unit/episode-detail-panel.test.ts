import { describe, expect, it } from "vitest";
import {
  EPISODE_DETAIL_PANEL_IDS,
  parseEpisodeDetailPanelParam,
} from "@/lib/studio-productions/episode-detail-panel";

describe("parseEpisodeDetailPanelParam", () => {
  it("accepts known panel ids", () => {
    for (const id of EPISODE_DETAIL_PANEL_IDS) {
      expect(parseEpisodeDetailPanelParam(id)).toBe(id);
    }
  });

  it("returns null for unknown or empty", () => {
    expect(parseEpisodeDetailPanelParam(null)).toBeNull();
    expect(parseEpisodeDetailPanelParam("")).toBeNull();
    expect(parseEpisodeDetailPanelParam("draft ")).toBeNull();
    expect(parseEpisodeDetailPanelParam("artifacts")).toBeNull();
  });

  it("maps legacy draft panel to pipeline", () => {
    expect(parseEpisodeDetailPanelParam("draft")).toBe("pipeline");
  });
});
