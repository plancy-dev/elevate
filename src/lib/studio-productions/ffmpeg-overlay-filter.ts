/**
 * FFmpeg filter graph builders for the timeline editor (ADR-010 §4).
 *
 * These are **pure string builders** — no FFmpeg invocation, no file IO. The
 * assembly worker composes them into its `-filter_complex` argument. Keeping
 * the builders pure lets us unit-test the exact filter string, which is
 * critical because FFmpeg fails with opaque errors on malformed graphs.
 *
 * All output strings assume the assembly pipeline has already:
 *   - normalized each scene to a single-input `[v<i>]` and `[a<i>]` pair, and
 *   - computed world-start offsets matching `computeSceneWorldTimes(scenes)`.
 *
 * None of the builders emit trailing newlines. Callers concatenate with ";".
 */

import type {
  EditorOverlay,
  EditorScene,
  OverlayAnimation,
  OverlayPosition,
} from "@/lib/studio-productions/editor-dsl";

/**
 * Escape a string for use inside `drawtext=text='…'`.
 * FFmpeg uses backslashes to escape `:`, `\`, and single quotes; colons are
 * especially tricky because they also separate filter options.
 */
export function escapeDrawtext(raw: string): string {
  return raw
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/:/g, "\\:")
    .replace(/%/g, "\\%")
    .replace(/\n/g, "\\n");
}

function hexToFfmpegColor(hex: string, alpha: number): string {
  // drawtext accepts `fontcolor=white@0.6` or hex `0xRRGGBB@alpha`.
  const clean = hex.replace("#", "");
  if (clean.length === 6) {
    return `0x${clean.toUpperCase()}@${alpha.toFixed(3)}`;
  }
  return `white@${alpha.toFixed(3)}`;
}

function positionToXY(
  position: OverlayPosition,
): { x: string; y: string } {
  // `(w-text_w)/2` centers a drawtext block horizontally; we lean on the same
  // idiom for custom positions by treating `xPct` as the anchor for the
  // block's center.
  if (position === "top") {
    return { x: "(w-text_w)/2", y: "h*0.08" };
  }
  if (position === "center") {
    return { x: "(w-text_w)/2", y: "(h-text_h)/2" };
  }
  if (position === "bottom") {
    return { x: "(w-text_w)/2", y: "h*0.85" };
  }
  const cx = Math.max(0, Math.min(position.xPct, 100)) / 100;
  const cy = Math.max(0, Math.min(position.yPct, 100)) / 100;
  return {
    x: `(w*${cx.toFixed(4)})-(text_w/2)`,
    y: `(h*${cy.toFixed(4)})-(text_h/2)`,
  };
}

function alphaExpr(
  animation: OverlayAnimation,
  startSec: number,
  durationSec: number,
): string | null {
  // `drawtext` takes an `alpha` expression; we synthesize a time-based ramp.
  // t is the world time fed in from the pipeline's global time.
  if (animation === "fade_in" && durationSec > 0) {
    const start = startSec.toFixed(3);
    const end = (startSec + durationSec).toFixed(3);
    return escapeFfmpegExpr(
      `if(lt(t,${start}),0,if(lt(t,${end}),(t-${start})/${durationSec.toFixed(3)},1))`,
    );
  }
  return null;
}

function slideYOffsetExpr(
  animation: OverlayAnimation,
  startSec: number,
  durationSec: number,
): string | null {
  if (animation !== "slide_up" || durationSec <= 0) return null;
  const start = startSec.toFixed(3);
  const end = (startSec + durationSec).toFixed(3);
  // Travel 24 px upward during the animation window.
  return escapeFfmpegExpr(
    `if(lt(t,${start}),24,if(lt(t,${end}),24-24*(t-${start})/${durationSec.toFixed(3)},0))`,
  );
}

function buildSingleDrawtext(overlay: EditorOverlay): string {
  const style = overlay.style;
  const text = escapeDrawtext(overlay.text);
  const fontColor = hexToFfmpegColor(style.fontColor, 1);
  const boxColor = hexToFfmpegColor(
    style.backgroundColor,
    style.backgroundOpacity,
  );
  const { x, y } = positionToXY(overlay.position);
  const enable = escapeFfmpegExpr(
    `between(t,${overlay.startSec.toFixed(3)},${overlay.endSec.toFixed(3)})`,
  );

  const parts = [
    `drawtext=text='${text}'`,
    `fontsize=${Math.round(style.fontSize)}`,
    `fontcolor=${fontColor}`,
    `x=${x}`,
    // Slide-up adds a transient vertical offset; otherwise y is fixed.
    (() => {
      const slide = slideYOffsetExpr(
        overlay.animation,
        overlay.startSec,
        overlay.animationDurationSec,
      );
      return slide ? `y=(${y})+(${slide})` : `y=${y}`;
    })(),
    `box=1`,
    `boxcolor=${boxColor}`,
    `boxborderw=${Math.round(Math.max(style.paddingX, style.paddingY))}`,
    `enable='${enable}'`,
  ];

  const alpha = alphaExpr(
    overlay.animation,
    overlay.startSec,
    overlay.animationDurationSec,
  );
  if (alpha) parts.push(`alpha='${alpha}'`);

  return parts.join(":");
}

function escapeFfmpegExpr(expr: string): string {
  // drawtext expression values frequently include commas. They must be escaped
  // so filter option parsing does not split expression arguments.
  return expr.replace(/,/g, "\\,");
}

/**
 * Chain of `drawtext` filters applied on top of `[vin]` to produce `[vout]`.
 * Returns an empty string when no overlays — callers can skip.
 */
export function buildOverlayFilterGraph(
  overlays: EditorOverlay[],
  opts: { inputLabel: string; outputLabel: string },
): string {
  if (overlays.length === 0) return "";
  const active = [...overlays].sort((a, b) => a.startSec - b.startSec);
  const chain = active.map(buildSingleDrawtext).join(",");
  return `[${opts.inputLabel}]${chain}[${opts.outputLabel}]`;
}

/**
 * Compute the `xfade` chain for the video-only concat variant.
 *
 * Input: one `[v<i>]` label per scene (already trimmed to
 * `targetDurationSec`). Output: a single `[vxf]` label with adjacent
 * scenes cross-faded according to `scenes[i].transitionToNextMs`.
 *
 * When every transition is 0 ms the function returns an empty string and
 * the caller should fall back to `concat=`.
 */
export function buildXfadeFilter(
  scenes: EditorScene[],
  opts: { inputLabelPrefix: string; outputLabel: string },
): string {
  if (scenes.length < 2) return "";
  const hasAny = scenes.some(
    (s, i) => i < scenes.length - 1 && (s.transitionToNextMs ?? 0) > 0,
  );
  if (!hasAny) return "";

  let cursorLabel = `${opts.inputLabelPrefix}0`;
  let offsetSec = scenes[0].targetDurationSec;
  const pieces: string[] = [];
  for (let i = 1; i < scenes.length; i += 1) {
    const tMs = scenes[i - 1].transitionToNextMs ?? 0;
    const durationSec = Math.max(tMs / 1000, 0);
    const nextLabel = `${opts.inputLabelPrefix}${i}`;
    const outputLabel =
      i === scenes.length - 1 ? opts.outputLabel : `xf${i}`;
    const startOffset = Math.max(offsetSec - durationSec, 0).toFixed(3);
    if (durationSec > 0) {
      pieces.push(
        `[${cursorLabel}][${nextLabel}]xfade=transition=fade:duration=${durationSec.toFixed(3)}:offset=${startOffset}[${outputLabel}]`,
      );
    } else {
      // Hard cut via concat of this pair.
      pieces.push(
        `[${cursorLabel}][${nextLabel}]concat=n=2:v=1:a=0[${outputLabel}]`,
      );
    }
    cursorLabel = outputLabel;
    offsetSec += scenes[i].targetDurationSec - durationSec;
  }
  return pieces.join(";");
}

export type AudioMixConfig = {
  narrationGainDb: number;
  bgm:
    | {
        gainDb: number;
        startSec: number;
        fadeInSec: number;
        fadeOutSec: number;
        totalDurationSec: number;
      }
    | null;
  inputNarrationLabel: string; // e.g. "n"
  inputBgmLabel: string; // e.g. "b"
  outputLabel: string; // e.g. "aout"
};

/**
 * Mix narration and BGM. When BGM is absent, returns a single `volume`
 * filter on the narration label so the graph is still uniform.
 */
export function buildAudioMixFilter(config: AudioMixConfig): string {
  const narrationGain = gainDbExpr(config.narrationGainDb);
  if (!config.bgm) {
    return `[${config.inputNarrationLabel}]volume=${narrationGain}[${config.outputLabel}]`;
  }
  const bgmGain = gainDbExpr(config.bgm.gainDb);
  const fadeIn = config.bgm.fadeInSec;
  const fadeOut = config.bgm.fadeOutSec;
  const totalSec = config.bgm.totalDurationSec;
  const fadeOutStart = Math.max(0, totalSec - fadeOut);
  // Delay BGM by `startSec * 1000` ms so narration can start first.
  const delayMs = Math.round(Math.max(0, config.bgm.startSec) * 1000);

  const narrationFilter = `[${config.inputNarrationLabel}]volume=${narrationGain}[na]`;
  const bgmFilters: string[] = [
    `[${config.inputBgmLabel}]adelay=${delayMs}|${delayMs}[b0]`,
    `[b0]volume=${bgmGain}[b1]`,
  ];
  if (fadeIn > 0) {
    bgmFilters.push(
      `[b1]afade=t=in:st=${config.bgm.startSec.toFixed(3)}:d=${fadeIn.toFixed(3)}[b2]`,
    );
  } else {
    bgmFilters.push(`[b1]anull[b2]`);
  }
  if (fadeOut > 0) {
    bgmFilters.push(
      `[b2]afade=t=out:st=${fadeOutStart.toFixed(3)}:d=${fadeOut.toFixed(3)}[b3]`,
    );
  } else {
    bgmFilters.push(`[b2]anull[b3]`);
  }
  bgmFilters.push(
    `[na][b3]amix=inputs=2:dropout_transition=0:duration=longest[${config.outputLabel}]`,
  );
  return [narrationFilter, ...bgmFilters].join(";");
}

function gainDbExpr(db: number): string {
  // FFmpeg `volume=` accepts either a multiplier or a dB expression via `dB`
  // suffix. Using dB is more robust than pre-converting, because it keeps
  // the filter string human-readable.
  const clamped = Math.max(-30, Math.min(db, 6));
  return `${clamped.toFixed(1)}dB`;
}
