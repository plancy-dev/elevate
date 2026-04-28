import { describe, expect, it } from "vitest";
import { computeSceneWorldTimes } from "@/lib/studio-productions/editor-dsl";
import {
  getColumnPlayheadX,
  getColumnScrubTimeFromX,
  getSceneIndexAtTime,
} from "@/components/dashboard/editor/timeline/timeline";

function buildScenes(count: number, durationSec = 2.5) {
  return Array.from({ length: count }).map((_, idx) => ({
    targetDurationSec: durationSec + (idx % 3) * 0.5,
  }));
}

describe("editor column timeline mapping", () => {
  const scenes = buildScenes(24);
  const starts = computeSceneWorldTimes(
    scenes.map((scene, idx) => ({
      id: `scene-${idx}`,
      sourceArtifactId: `artifact-${idx}`,
      sourceUrl: "https://example.com/clip.mp4",
      targetDurationSec: scene.targetDurationSec,
      trimStartSec: 0,
      loop: false,
      transitionToNextMs: 0,
    })),
  );
  const totalDurationSec = scenes.reduce((sum, scene) => sum + scene.targetDurationSec, 0);
  const columnWidth = 280;
  const columnSpan = 281;

  it("maps playhead across 24-scene column area bounds", () => {
    const startX = getColumnPlayheadX(0, totalDurationSec, scenes, starts, columnWidth, columnSpan);
    const endX = getColumnPlayheadX(
      totalDurationSec,
      totalDurationSec,
      scenes,
      starts,
      columnWidth,
      columnSpan,
    );
    const maxTrackX = 24 * columnSpan;

    expect(startX).toBeGreaterThanOrEqual(0);
    expect(endX).toBeGreaterThan(startX);
    expect(endX).toBeLessThanOrEqual(maxTrackX);
  });

  it("resolves scene index transitions around boundaries", () => {
    expect(getSceneIndexAtTime(0, scenes, starts)).toBe(0);
    expect(getSceneIndexAtTime(starts[1] - 0.001, scenes, starts)).toBe(0);
    expect(getSceneIndexAtTime(starts[1], scenes, starts)).toBe(1);
    expect(getSceneIndexAtTime(totalDurationSec - 0.001, scenes, starts)).toBe(23);
  });

  it("converts scrub x-position to valid timeline seconds", () => {
    const scene7StartX = 7 * columnSpan;
    const secAtScene7Start = getColumnScrubTimeFromX(
      scene7StartX,
      totalDurationSec,
      scenes,
      starts,
      columnWidth,
      columnSpan,
    );
    const secAtScene7Mid = getColumnScrubTimeFromX(
      scene7StartX + columnWidth / 2,
      totalDurationSec,
      scenes,
      starts,
      columnWidth,
      columnSpan,
    );
    const secAtFarRight = getColumnScrubTimeFromX(
      999_999,
      totalDurationSec,
      scenes,
      starts,
      columnWidth,
      columnSpan,
    );

    expect(secAtScene7Start).toBeCloseTo(starts[7], 3);
    expect(secAtScene7Mid).toBeGreaterThan(secAtScene7Start);
    expect(secAtFarRight).toBeLessThanOrEqual(totalDurationSec);
    expect(secAtFarRight).toBeGreaterThan(0);
  });
});
