import { describe, expect, it } from "vitest";
import {
  buildAudioMixFilter,
  buildOverlayFilterGraph,
  buildXfadeFilter,
  escapeDrawtext,
} from "@/lib/studio-productions/ffmpeg-overlay-filter";
import {
  DEFAULT_OVERLAY_STYLE,
  type EditorOverlay,
  type EditorScene,
} from "@/lib/studio-productions/editor-dsl";

function makeOverlay(overrides: Partial<EditorOverlay> = {}): EditorOverlay {
  return {
    id: "o-1",
    kind: "text",
    text: "Hello",
    startSec: 1,
    endSec: 3,
    position: "bottom",
    style: DEFAULT_OVERLAY_STYLE,
    animation: "none",
    animationDurationSec: 0,
    ...overrides,
  };
}

function makeScene(overrides: Partial<EditorScene> = {}): EditorScene {
  return {
    id: "s-1",
    sourceArtifactId: "a-1",
    sourceUrl: "https://example.com/1.mp4",
    targetDurationSec: 5,
    trimStartSec: 0,
    loop: false,
    transitionToNextMs: 0,
    ...overrides,
  };
}

describe("escapeDrawtext", () => {
  it("escapes colons, backslashes, and quotes", () => {
    expect(escapeDrawtext("a:b")).toBe("a\\:b");
    expect(escapeDrawtext("a'b")).toBe("a\\'b");
    expect(escapeDrawtext("line1\nline2")).toBe("line1\\nline2");
  });
});

describe("buildOverlayFilterGraph", () => {
  it("returns empty string for no overlays", () => {
    expect(
      buildOverlayFilterGraph([], { inputLabel: "vin", outputLabel: "vout" }),
    ).toBe("");
  });

  it("chains a single drawtext with correct labels", () => {
    const graph = buildOverlayFilterGraph([makeOverlay()], {
      inputLabel: "vin",
      outputLabel: "vout",
    });
    expect(graph.startsWith("[vin]")).toBe(true);
    expect(graph.endsWith("[vout]")).toBe(true);
    expect(graph).toContain("drawtext=text='Hello'");
    expect(graph).toContain("enable='between(t\\,1.000\\,3.000)'");
  });

  it("sorts overlays by startSec", () => {
    const graph = buildOverlayFilterGraph(
      [
        makeOverlay({ id: "a", text: "second", startSec: 5, endSec: 7 }),
        makeOverlay({ id: "b", text: "first", startSec: 1, endSec: 3 }),
      ],
      { inputLabel: "vin", outputLabel: "vout" },
    );
    const firstPos = graph.indexOf("first");
    const secondPos = graph.indexOf("second");
    expect(firstPos).toBeGreaterThan(-1);
    expect(firstPos).toBeLessThan(secondPos);
  });

  it("adds alpha expression for fade_in animation", () => {
    const graph = buildOverlayFilterGraph(
      [
        makeOverlay({
          animation: "fade_in",
          animationDurationSec: 0.5,
          startSec: 2,
          endSec: 4,
        }),
      ],
      { inputLabel: "vin", outputLabel: "vout" },
    );
    expect(graph).toMatch(/alpha='if\(lt\(t\\,2\.000\)/);
  });

  it("adds slide offset for slide_up animation", () => {
    const graph = buildOverlayFilterGraph(
      [
        makeOverlay({
          animation: "slide_up",
          animationDurationSec: 0.4,
          startSec: 1,
          endSec: 3,
        }),
      ],
      { inputLabel: "vin", outputLabel: "vout" },
    );
    expect(graph).toMatch(/y=\(h\*0\.85\)\+\(if\(lt\(t\\,1\.000\)/);
  });
});

describe("buildXfadeFilter", () => {
  it("returns empty string when every transition is 0 ms", () => {
    const scenes = [makeScene(), makeScene({ id: "s-2" })];
    const out = buildXfadeFilter(scenes, {
      inputLabelPrefix: "v",
      outputLabel: "vxf",
    });
    expect(out).toBe("");
  });

  it("chains an xfade between two scenes with a transition", () => {
    const scenes = [
      makeScene({ id: "s-1", targetDurationSec: 5, transitionToNextMs: 500 }),
      makeScene({ id: "s-2", targetDurationSec: 4 }),
    ];
    const out = buildXfadeFilter(scenes, {
      inputLabelPrefix: "v",
      outputLabel: "vxf",
    });
    expect(out).toContain(
      "[v0][v1]xfade=transition=fade:duration=0.500:offset=4.500[vxf]",
    );
  });

  it("supports three-scene chains with mixed transitions", () => {
    const scenes = [
      makeScene({ id: "a", targetDurationSec: 5, transitionToNextMs: 300 }),
      makeScene({ id: "b", targetDurationSec: 4, transitionToNextMs: 0 }),
      makeScene({ id: "c", targetDurationSec: 3 }),
    ];
    const out = buildXfadeFilter(scenes, {
      inputLabelPrefix: "v",
      outputLabel: "vxf",
    });
    expect(out).toContain("[v0][v1]xfade=");
    expect(out).toContain("[v2]");
    expect(out).toContain("[vxf]");
  });
});

describe("buildAudioMixFilter", () => {
  it("emits a single volume filter when BGM is null", () => {
    const out = buildAudioMixFilter({
      narrationGainDb: -3,
      bgm: null,
      inputNarrationLabel: "n",
      inputBgmLabel: "b",
      outputLabel: "aout",
    });
    expect(out).toBe("[n]volume=-3.0dB[aout]");
  });

  it("composes narration + BGM with amix and fades", () => {
    const out = buildAudioMixFilter({
      narrationGainDb: 0,
      bgm: {
        gainDb: -6,
        startSec: 2,
        fadeInSec: 1,
        fadeOutSec: 1,
        totalDurationSec: 10,
      },
      inputNarrationLabel: "n",
      inputBgmLabel: "b",
      outputLabel: "aout",
    });
    expect(out).toContain("[n]volume=0.0dB[na]");
    expect(out).toContain("[b]adelay=2000|2000[b0]");
    expect(out).toContain("[b0]volume=-6.0dB[b1]");
    expect(out).toContain("afade=t=in:st=2.000:d=1.000");
    expect(out).toContain("afade=t=out:st=9.000:d=1.000");
    expect(out).toContain(
      "amix=inputs=2:dropout_transition=0:duration=longest[aout]",
    );
  });
});
