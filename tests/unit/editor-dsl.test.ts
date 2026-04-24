import { describe, expect, it } from "vitest";
import {
  DEFAULT_OVERLAY_STYLE,
  EDITOR_DSL_MAX_OVERLAYS,
  EDITOR_DSL_MAX_SCENES,
  computeSceneWorldTimes,
  dslToAssemblyJobInput,
  gainDbToLinear,
  isEditorDslV3,
  parseEditorDslV3,
  type EditorDslV3,
  type EditorScene,
} from "@/lib/studio-productions/editor-dsl";

function makeScene(overrides: Partial<EditorScene> = {}): EditorScene {
  return {
    id: "scene-1",
    sourceArtifactId: "artifact-1",
    sourceUrl: "https://example.com/scene1.mp4",
    targetDurationSec: 5,
    trimStartSec: 0,
    loop: false,
    transitionToNextMs: 0,
    ...overrides,
  };
}

function makeDsl(overrides: Partial<EditorDslV3> = {}): EditorDslV3 {
  return {
    version: 3,
    episodeId: "ep-1",
    format: "shorts",
    resolution: { width: 1080, height: 1920 },
    totalDurationSec: 5,
    scenes: [makeScene()],
    overlays: [],
    audio: { narration: null, bgm: null },
    updatedAt: "2026-04-24T00:00:00.000Z",
    ...overrides,
  };
}

describe("parseEditorDslV3", () => {
  it("accepts a minimal valid DSL", () => {
    const parsed = parseEditorDslV3(makeDsl());
    expect(parsed).not.toBeNull();
    expect(parsed?.version).toBe(3);
    expect(parsed?.scenes).toHaveLength(1);
  });

  it("rejects wrong version", () => {
    expect(parseEditorDslV3(makeDsl({ version: 2 as never }))).toBeNull();
  });

  it("rejects unknown format", () => {
    expect(parseEditorDslV3(makeDsl({ format: "vertical" as never }))).toBeNull();
  });

  it("rejects absurd total duration", () => {
    expect(parseEditorDslV3(makeDsl({ totalDurationSec: 9999 }))).toBeNull();
    expect(parseEditorDslV3(makeDsl({ totalDurationSec: 0 }))).toBeNull();
  });

  it("rejects empty scenes", () => {
    expect(parseEditorDslV3(makeDsl({ scenes: [] }))).toBeNull();
  });

  it("rejects too many scenes", () => {
    const tooMany = Array.from({ length: EDITOR_DSL_MAX_SCENES + 1 }, (_, i) =>
      makeScene({ id: `s-${i}` }),
    );
    expect(parseEditorDslV3(makeDsl({ scenes: tooMany }))).toBeNull();
  });

  it("rejects scene with non-unique no-op — overlays enforce uniqueness instead", () => {
    // Scenes don't have a uniqueness constraint; duplicate IDs pass (we use
    // positional ordering for preview, not IDs). The UI keeps IDs unique.
    const dupe = parseEditorDslV3(
      makeDsl({ scenes: [makeScene({ id: "a" }), makeScene({ id: "a" })] , totalDurationSec: 10}),
    );
    expect(dupe).not.toBeNull();
  });

  it("rejects duplicate overlay IDs", () => {
    const overlay = {
      id: "o-1",
      kind: "text" as const,
      text: "Hello",
      startSec: 0,
      endSec: 2,
      position: "top" as const,
      style: DEFAULT_OVERLAY_STYLE,
      animation: "fade_in" as const,
      animationDurationSec: 0.3,
    };
    const dsl = makeDsl({ overlays: [overlay, overlay] });
    expect(parseEditorDslV3(dsl)).toBeNull();
  });

  it("rejects too many overlays", () => {
    const overlays = Array.from(
      { length: EDITOR_DSL_MAX_OVERLAYS + 1 },
      (_, i) => ({
        id: `o-${i}`,
        kind: "text" as const,
        text: `${i}`,
        startSec: 0,
        endSec: 1,
        position: "top" as const,
        style: DEFAULT_OVERLAY_STYLE,
        animation: "none" as const,
        animationDurationSec: 0,
      }),
    );
    expect(parseEditorDslV3(makeDsl({ overlays }))).toBeNull();
  });

  it("rejects overlay with endSec beyond totalDurationSec (plus epsilon)", () => {
    const dsl = makeDsl({
      totalDurationSec: 5,
      overlays: [
        {
          id: "o-1",
          kind: "text",
          text: "x",
          startSec: 0,
          endSec: 10,
          position: "top",
          style: DEFAULT_OVERLAY_STYLE,
          animation: "none",
          animationDurationSec: 0,
        },
      ],
    });
    expect(parseEditorDslV3(dsl)).toBeNull();
  });

  it("clamps narration gainDb to [-30, 6]", () => {
    const parsed = parseEditorDslV3(
      makeDsl({
        audio: {
          narration: { artifactId: "a", url: "u", gainDb: 999 },
          bgm: null,
        },
      }),
    );
    expect(parsed?.audio.narration?.gainDb).toBe(6);
  });

  it("accepts positional overlay positions", () => {
    const parsed = parseEditorDslV3(
      makeDsl({
        overlays: [
          {
            id: "o-1",
            kind: "text",
            text: "Hi",
            startSec: 0,
            endSec: 2,
            position: { xPct: 50, yPct: 80 },
            style: DEFAULT_OVERLAY_STYLE,
            animation: "slide_up",
            animationDurationSec: 0.4,
          },
        ],
      }),
    );
    expect(parsed?.overlays[0]?.position).toEqual({ xPct: 50, yPct: 80 });
  });

  it("rejects out-of-range positional overlay", () => {
    const parsed = parseEditorDslV3(
      makeDsl({
        overlays: [
          {
            id: "o-1",
            kind: "text",
            text: "Hi",
            startSec: 0,
            endSec: 2,
            position: { xPct: 150, yPct: 80 },
            style: DEFAULT_OVERLAY_STYLE,
            animation: "none",
            animationDurationSec: 0,
          },
        ],
      }),
    );
    expect(parsed).toBeNull();
  });
});

describe("isEditorDslV3", () => {
  it("is true for a valid DSL and false for junk", () => {
    expect(isEditorDslV3(makeDsl())).toBe(true);
    expect(isEditorDslV3(null)).toBe(false);
    expect(isEditorDslV3({})).toBe(false);
    expect(isEditorDslV3("not json")).toBe(false);
  });
});

describe("computeSceneWorldTimes", () => {
  it("accumulates durations with 0 transitions", () => {
    const scenes = [
      makeScene({ id: "a", targetDurationSec: 5 }),
      makeScene({ id: "b", targetDurationSec: 4 }),
      makeScene({ id: "c", targetDurationSec: 3 }),
    ];
    expect(computeSceneWorldTimes(scenes)).toEqual([0, 5, 9]);
  });

  it("subtracts transition time from the world gap", () => {
    const scenes = [
      makeScene({ id: "a", targetDurationSec: 5, transitionToNextMs: 500 }),
      makeScene({ id: "b", targetDurationSec: 4, transitionToNextMs: 0 }),
    ];
    expect(computeSceneWorldTimes(scenes)).toEqual([0, 4.5]);
  });
});

describe("dslToAssemblyJobInput", () => {
  it("produces a v2-compatible input plus v3 editor_extensions", () => {
    const dsl = makeDsl({
      totalDurationSec: 8,
      scenes: [
        makeScene({ id: "a", targetDurationSec: 5, transitionToNextMs: 300 }),
        makeScene({
          id: "b",
          sourceUrl: "https://example.com/2.mp4",
          targetDurationSec: 3,
        }),
      ],
      audio: {
        narration: { artifactId: "n", url: "https://n.mp3", gainDb: -3 },
        bgm: {
          url: "https://b.mp3",
          gainDb: -6,
          startSec: 1,
          fadeInSec: 0.5,
          fadeOutSec: 1,
        },
      },
    });
    const input = dslToAssemblyJobInput(dsl, null, null);
    expect(input.clip_urls).toEqual([
      "https://example.com/scene1.mp4",
      "https://example.com/2.mp4",
    ]);
    expect(input.per_scene).toHaveLength(2);
    expect(input.per_scene?.[0].world_start_sec).toBe(0);
    expect(input.per_scene?.[1].world_start_sec).toBe(4.7);
    expect(input.audio_url).toBe("https://n.mp3");
    expect(input.bg_music_url).toBe("https://b.mp3");
    expect(input.episode_format).toBe("shorts");
    expect(input.editor_extensions?.dsl_version).toBe(3);
    expect(input.editor_extensions?.scene_transitions_ms).toEqual([300, 0]);
  });

  it("prefers the explicit audioUrl argument over the DSL narration", () => {
    const dsl = makeDsl({
      audio: {
        narration: { artifactId: "n", url: "https://fallback", gainDb: 0 },
        bgm: null,
      },
    });
    const input = dslToAssemblyJobInput(dsl, "https://override", "srt");
    expect(input.audio_url).toBe("https://override");
    expect(input.srt_content).toBe("srt");
  });
});

describe("gainDbToLinear", () => {
  it("is 1.0 at 0 dB", () => {
    expect(gainDbToLinear(0)).toBeCloseTo(1.0, 4);
  });

  it("halves at -6 dB (approx)", () => {
    expect(gainDbToLinear(-6)).toBeCloseTo(0.5012, 3);
  });

  it("clamps silly extremes", () => {
    expect(gainDbToLinear(999)).toBeLessThanOrEqual(2);
    expect(gainDbToLinear(-999)).toBeGreaterThanOrEqual(0);
  });
});
