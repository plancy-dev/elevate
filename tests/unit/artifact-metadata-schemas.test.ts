import { describe, expect, it } from "vitest";
import {
  normalizeArtifactMetadataForWrite,
  parseArtifactMetadata,
} from "@/lib/studio-productions/artifact-metadata-schemas";

describe("artifact-metadata-schemas", () => {
  it("coerces numeric strings for known scene_clip keys", () => {
    const parsed = parseArtifactMetadata("scene_clip", {
      source: "runway_i2v",
      scene_index: "3",
      duration_seconds: "8",
      target_duration_sec: "8",
    });
    expect(parsed?.scene_index).toBe(3);
    expect(parsed?.duration_seconds).toBe(8);
    expect(parsed?.target_duration_sec).toBe(8);
  });

  it("keeps unknown keys via passthrough", () => {
    const parsed = parseArtifactMetadata("tts_audio", {
      source: "elevenlabs",
      custom_field: "keep-me",
    });
    expect(parsed?.custom_field).toBe("keep-me");
  });

  it("returns null for non-object metadata", () => {
    expect(normalizeArtifactMetadataForWrite("subtitle_srt", null)).toBeNull();
    expect(normalizeArtifactMetadataForWrite("subtitle_srt", "bad" as never)).toBeNull();
  });
});
