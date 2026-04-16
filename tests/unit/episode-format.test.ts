import { describe, expect, it } from "vitest";
import {
  resolveEpisodeFormat,
  FORMAT_SPECS,
} from "@/lib/studio-productions/episode-format";

describe("resolveEpisodeFormat", () => {
  it("returns 'shorts' for youtube_shorts distribution", () => {
    expect(resolveEpisodeFormat({ distribution_label: "youtube_shorts" })).toBe("shorts");
  });

  it("returns 'longform' for youtube_long distribution", () => {
    expect(resolveEpisodeFormat({ distribution_label: "youtube_long" })).toBe("longform");
  });

  it("returns 'shorts' for instagram_reels distribution", () => {
    expect(resolveEpisodeFormat({ distribution_label: "instagram_reels" })).toBe("shorts");
  });

  it("returns 'shorts' for tiktok distribution", () => {
    expect(resolveEpisodeFormat({ distribution_label: "tiktok" })).toBe("shorts");
  });

  it("returns 'longform' for linkedin distribution", () => {
    expect(resolveEpisodeFormat({ distribution_label: "linkedin" })).toBe("longform");
  });

  it("falls back to channel platform when label is empty", () => {
    expect(
      resolveEpisodeFormat({
        distribution_label: "",
        studio_distribution_channels: { platform: "youtube_shorts" },
      }),
    ).toBe("shorts");
  });

  it("defaults to 'shorts' when no signal", () => {
    expect(resolveEpisodeFormat({})).toBe("shorts");
  });
});

describe("FORMAT_SPECS", () => {
  it("shorts uses 9:16 vertical", () => {
    expect(FORMAT_SPECS.shorts.ratio).toBe("720:1280");
    expect(FORMAT_SPECS.shorts.resolution).toBe("1080x1920");
  });

  it("longform uses 16:9 horizontal", () => {
    expect(FORMAT_SPECS.longform.ratio).toBe("1280:720");
    expect(FORMAT_SPECS.longform.resolution).toBe("1920x1080");
  });

  it("shorts maxSeconds is 180 (post-2024.10 policy)", () => {
    expect(FORMAT_SPECS.shorts.maxSeconds).toBe(180);
  });
});
