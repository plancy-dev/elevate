/**
 * Timeline editor DSL v3 (ADR-010).
 *
 * A superset of the v2 `VideoAssemblyJobInput` shape. The editor UI produces
 * and edits DSL v3, then `dslToAssemblyJobInput` maps it to the worker's
 * v2-compatible input before the assembly job is enqueued.
 *
 * The DSL is intentionally pure/serializable: no functions, no `Date`, no
 * class instances. Everything must survive `JSON.stringify` round-trips so
 * it can be persisted to `episode.pipeline_prefs.editor` and
 * `studio_video_assembly_jobs.input_json`.
 */

import type { EpisodeFormat } from "@/lib/studio-productions/episode-format";
import type {
  PerSceneAssemblyClip,
  VideoAssemblyJobInput,
} from "@/lib/studio-productions/video-assembly-job-input";

export const EDITOR_DSL_VERSION = 3 as const;

/** Hard cap on overlays — keeps `filter_complex` strings manageable. */
export const EDITOR_DSL_MAX_OVERLAYS = 16;
export const EDITOR_DSL_MAX_SCENES = 32;
export const EDITOR_DSL_MAX_TOTAL_SECONDS = 600;

export type OverlayPosition =
  | "top"
  | "center"
  | "bottom"
  | { xPct: number; yPct: number };

export type OverlayAnimation = "none" | "fade_in" | "slide_up";

export type OverlayTextStyle = {
  fontFamily: "system" | "serif" | "mono";
  fontSize: number;
  fontWeight: 400 | 600 | 700;
  fontColor: string;
  backgroundColor: string;
  backgroundOpacity: number;
  borderRadius: number;
  paddingX: number;
  paddingY: number;
};

export type EditorScene = {
  id: string;
  sourceArtifactId: string;
  sourceUrl: string;
  targetDurationSec: number;
  trimStartSec: number;
  loop: boolean;
  /** Cross-fade into the next scene. 0 = hard cut. */
  transitionToNextMs: number;
};

export type EditorOverlay = {
  id: string;
  kind: "text";
  text: string;
  startSec: number;
  endSec: number;
  position: OverlayPosition;
  style: OverlayTextStyle;
  animation: OverlayAnimation;
  animationDurationSec: number;
};

export type EditorAudio = {
  narration: {
    artifactId: string;
    url: string;
    /** Negative values reduce volume. 0 = no change. */
    gainDb: number;
  } | null;
  bgm: {
    url: string;
    gainDb: number;
    startSec: number;
    fadeInSec: number;
    fadeOutSec: number;
  } | null;
};

export type EditorDslV3 = {
  version: typeof EDITOR_DSL_VERSION;
  episodeId: string;
  format: EpisodeFormat;
  resolution: { width: number; height: number };
  totalDurationSec: number;
  scenes: EditorScene[];
  overlays: EditorOverlay[];
  audio: EditorAudio;
  /** ISO 8601 — used by the save action for last-write-wins comparison. */
  updatedAt: string;
};

export const DEFAULT_OVERLAY_STYLE: OverlayTextStyle = {
  fontFamily: "system",
  fontSize: 48,
  fontWeight: 600,
  fontColor: "#FFFFFF",
  backgroundColor: "#000000",
  backgroundOpacity: 0.6,
  borderRadius: 12,
  paddingX: 18,
  paddingY: 10,
};

export const EDITOR_DSL_DEFAULT_RESOLUTION = {
  shorts: { width: 1080, height: 1920 },
  longform: { width: 1920, height: 1080 },
} as const;

// --- Validation --------------------------------------------------------------

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function isHexColor(v: unknown): v is string {
  return (
    typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v)
  );
}

function parseOverlayStyle(raw: unknown): OverlayTextStyle | null {
  if (!isPlainObject(raw)) return null;
  const font = raw.fontFamily;
  if (font !== "system" && font !== "serif" && font !== "mono") return null;
  if (!isFiniteNumber(raw.fontSize) || raw.fontSize < 8 || raw.fontSize > 200) {
    return null;
  }
  if (raw.fontWeight !== 400 && raw.fontWeight !== 600 && raw.fontWeight !== 700) {
    return null;
  }
  if (!isHexColor(raw.fontColor) || !isHexColor(raw.backgroundColor)) return null;
  if (
    !isFiniteNumber(raw.backgroundOpacity) ||
    raw.backgroundOpacity < 0 ||
    raw.backgroundOpacity > 1
  ) {
    return null;
  }
  if (!isFiniteNumber(raw.borderRadius) || raw.borderRadius < 0) return null;
  if (!isFiniteNumber(raw.paddingX) || raw.paddingX < 0) return null;
  if (!isFiniteNumber(raw.paddingY) || raw.paddingY < 0) return null;
  return {
    fontFamily: font,
    fontSize: raw.fontSize,
    fontWeight: raw.fontWeight,
    fontColor: raw.fontColor,
    backgroundColor: raw.backgroundColor,
    backgroundOpacity: raw.backgroundOpacity,
    borderRadius: raw.borderRadius,
    paddingX: raw.paddingX,
    paddingY: raw.paddingY,
  };
}

function parseOverlayPosition(raw: unknown): OverlayPosition | null {
  if (raw === "top" || raw === "center" || raw === "bottom") return raw;
  if (isPlainObject(raw)) {
    if (
      isFiniteNumber(raw.xPct) &&
      isFiniteNumber(raw.yPct) &&
      raw.xPct >= 0 &&
      raw.xPct <= 100 &&
      raw.yPct >= 0 &&
      raw.yPct <= 100
    ) {
      return { xPct: raw.xPct, yPct: raw.yPct };
    }
  }
  return null;
}

function parseScene(raw: unknown): EditorScene | null {
  if (!isPlainObject(raw)) return null;
  if (typeof raw.id !== "string" || !raw.id.trim()) return null;
  if (typeof raw.sourceArtifactId !== "string" || !raw.sourceArtifactId.trim()) {
    return null;
  }
  if (typeof raw.sourceUrl !== "string" || !raw.sourceUrl.trim()) return null;
  if (
    !isFiniteNumber(raw.targetDurationSec) ||
    raw.targetDurationSec < 0.1 ||
    raw.targetDurationSec > 60
  ) {
    return null;
  }
  if (
    !isFiniteNumber(raw.trimStartSec) ||
    raw.trimStartSec < 0 ||
    raw.trimStartSec > 600
  ) {
    return null;
  }
  if (typeof raw.loop !== "boolean") return null;
  const transition = isFiniteNumber(raw.transitionToNextMs)
    ? Math.max(0, Math.min(raw.transitionToNextMs, 2000))
    : 0;
  return {
    id: raw.id,
    sourceArtifactId: raw.sourceArtifactId,
    sourceUrl: raw.sourceUrl,
    targetDurationSec: raw.targetDurationSec,
    trimStartSec: raw.trimStartSec,
    loop: raw.loop,
    transitionToNextMs: transition,
  };
}

function parseOverlay(raw: unknown): EditorOverlay | null {
  if (!isPlainObject(raw)) return null;
  if (typeof raw.id !== "string" || !raw.id.trim()) return null;
  if (raw.kind !== "text") return null;
  if (typeof raw.text !== "string") return null;
  if (raw.text.length > 500) return null;
  if (!isFiniteNumber(raw.startSec) || raw.startSec < 0) return null;
  if (!isFiniteNumber(raw.endSec) || raw.endSec <= raw.startSec) return null;
  const position = parseOverlayPosition(raw.position);
  if (!position) return null;
  const style = parseOverlayStyle(raw.style);
  if (!style) return null;
  if (
    raw.animation !== "none" &&
    raw.animation !== "fade_in" &&
    raw.animation !== "slide_up"
  ) {
    return null;
  }
  if (
    !isFiniteNumber(raw.animationDurationSec) ||
    raw.animationDurationSec < 0 ||
    raw.animationDurationSec > 5
  ) {
    return null;
  }
  return {
    id: raw.id,
    kind: "text",
    text: raw.text,
    startSec: raw.startSec,
    endSec: raw.endSec,
    position,
    style,
    animation: raw.animation,
    animationDurationSec: raw.animationDurationSec,
  };
}

function parseAudio(raw: unknown): EditorAudio | null {
  if (!isPlainObject(raw)) return null;
  let narration: EditorAudio["narration"] = null;
  if (raw.narration != null) {
    if (!isPlainObject(raw.narration)) return null;
    if (
      typeof raw.narration.artifactId !== "string" ||
      typeof raw.narration.url !== "string" ||
      !isFiniteNumber(raw.narration.gainDb)
    ) {
      return null;
    }
    narration = {
      artifactId: raw.narration.artifactId,
      url: raw.narration.url,
      gainDb: Math.max(-30, Math.min(raw.narration.gainDb, 6)),
    };
  }
  let bgm: EditorAudio["bgm"] = null;
  if (raw.bgm != null) {
    if (!isPlainObject(raw.bgm)) return null;
    if (
      typeof raw.bgm.url !== "string" ||
      !isFiniteNumber(raw.bgm.gainDb) ||
      !isFiniteNumber(raw.bgm.startSec) ||
      !isFiniteNumber(raw.bgm.fadeInSec) ||
      !isFiniteNumber(raw.bgm.fadeOutSec)
    ) {
      return null;
    }
    bgm = {
      url: raw.bgm.url,
      gainDb: Math.max(-30, Math.min(raw.bgm.gainDb, 6)),
      startSec: Math.max(0, raw.bgm.startSec),
      fadeInSec: Math.max(0, Math.min(raw.bgm.fadeInSec, 10)),
      fadeOutSec: Math.max(0, Math.min(raw.bgm.fadeOutSec, 10)),
    };
  }
  return { narration, bgm };
}

/**
 * Parse and narrow an unknown value into an `EditorDslV3`. Returns `null`
 * when any required field is missing or malformed. The parser is
 * forgiving about overall shape but strict on numeric ranges so the
 * server never gets absurd inputs like 10-hour durations or 999 overlays.
 */
export function parseEditorDslV3(raw: unknown): EditorDslV3 | null {
  if (!isPlainObject(raw)) return null;
  if (raw.version !== EDITOR_DSL_VERSION) return null;
  if (typeof raw.episodeId !== "string" || !raw.episodeId.trim()) return null;
  if (raw.format !== "shorts" && raw.format !== "longform") return null;
  if (!isPlainObject(raw.resolution)) return null;
  if (
    !isFiniteNumber(raw.resolution.width) ||
    !isFiniteNumber(raw.resolution.height) ||
    raw.resolution.width < 64 ||
    raw.resolution.height < 64
  ) {
    return null;
  }
  if (
    !isFiniteNumber(raw.totalDurationSec) ||
    raw.totalDurationSec <= 0 ||
    raw.totalDurationSec > EDITOR_DSL_MAX_TOTAL_SECONDS
  ) {
    return null;
  }
  if (!Array.isArray(raw.scenes) || raw.scenes.length === 0) return null;
  if (raw.scenes.length > EDITOR_DSL_MAX_SCENES) return null;
  const scenes: EditorScene[] = [];
  for (const s of raw.scenes) {
    const parsed = parseScene(s);
    if (!parsed) return null;
    scenes.push(parsed);
  }
  if (!Array.isArray(raw.overlays)) return null;
  if (raw.overlays.length > EDITOR_DSL_MAX_OVERLAYS) return null;
  const overlays: EditorOverlay[] = [];
  const seen = new Set<string>();
  for (const o of raw.overlays) {
    const parsed = parseOverlay(o);
    if (!parsed) return null;
    if (seen.has(parsed.id)) return null;
    seen.add(parsed.id);
    if (parsed.endSec > raw.totalDurationSec + 0.5) return null;
    overlays.push(parsed);
  }
  const audio = parseAudio(raw.audio);
  if (!audio) return null;
  const updatedAt =
    typeof raw.updatedAt === "string" && raw.updatedAt.trim()
      ? raw.updatedAt
      : new Date().toISOString();
  return {
    version: EDITOR_DSL_VERSION,
    episodeId: raw.episodeId,
    format: raw.format,
    resolution: { width: raw.resolution.width, height: raw.resolution.height },
    totalDurationSec: raw.totalDurationSec,
    scenes,
    overlays,
    audio,
    updatedAt,
  };
}

/**
 * Quick predicate for callers that only need a boolean.
 */
export function isEditorDslV3(raw: unknown): raw is EditorDslV3 {
  return parseEditorDslV3(raw) !== null;
}

// --- DSL -> worker input -----------------------------------------------------

/**
 * Compute world-time start offsets for each scene, taking cross-fades into
 * account. A cross-fade shortens the effective world gap between two
 * scenes by the transition duration so the preview and FFmpeg agree on
 * the timeline.
 */
export function computeSceneWorldTimes(scenes: EditorScene[]): number[] {
  const out: number[] = [];
  let t = 0;
  for (let i = 0; i < scenes.length; i += 1) {
    out.push(t);
    const transitionSec = (scenes[i].transitionToNextMs ?? 0) / 1000;
    t += scenes[i].targetDurationSec - transitionSec;
  }
  return out;
}

/**
 * Map the v3 DSL to the v2 `VideoAssemblyJobInput` the worker understands.
 * v3-only fields are carried through a sibling `editor_extensions` object.
 * Today, the worker actively consumes `overlays`; remaining fields are
 * reserved for incremental FFmpeg feature wiring (transition/audio refinements)
 * while legacy workers still produce video using base per-scene concat.
 */
export function dslToAssemblyJobInput(
  dsl: EditorDslV3,
  audioUrl: string | null,
  srt: string | null,
): VideoAssemblyJobInput & {
  editor_extensions?: {
    dsl_version: 3;
    overlays: EditorOverlay[];
    scene_transitions_ms: number[];
    bgm_fade_in_sec: number;
    bgm_fade_out_sec: number;
    bgm_start_sec: number;
    bgm_gain_db: number;
    narration_gain_db: number;
    resolution: { width: number; height: number };
  };
} {
  const perScene: PerSceneAssemblyClip[] = [];
  const worldTimes = computeSceneWorldTimes(dsl.scenes);
  for (let i = 0; i < dsl.scenes.length; i += 1) {
    const scene = dsl.scenes[i];
    perScene.push({
      clip_url: scene.sourceUrl,
      target_duration_sec: scene.targetDurationSec,
      trim_start_sec: scene.trimStartSec,
      loop: scene.loop,
      world_start_sec: worldTimes[i],
    });
  }

  const base: VideoAssemblyJobInput = {
    clip_urls: dsl.scenes.map((s) => s.sourceUrl),
    audio_url: audioUrl ?? dsl.audio.narration?.url ?? null,
    srt_content: srt,
    bg_music_url: dsl.audio.bgm?.url ?? null,
    bg_music_volume: dsl.audio.bgm ? gainDbToLinear(dsl.audio.bgm.gainDb) : null,
    episode_format: dsl.format,
    per_scene: perScene,
  };

  return {
    ...base,
    editor_extensions: {
      dsl_version: 3,
      overlays: dsl.overlays,
      scene_transitions_ms: dsl.scenes.map((s) => s.transitionToNextMs ?? 0),
      bgm_fade_in_sec: dsl.audio.bgm?.fadeInSec ?? 0,
      bgm_fade_out_sec: dsl.audio.bgm?.fadeOutSec ?? 0,
      bgm_start_sec: dsl.audio.bgm?.startSec ?? 0,
      bgm_gain_db: dsl.audio.bgm?.gainDb ?? 0,
      narration_gain_db: dsl.audio.narration?.gainDb ?? 0,
      resolution: dsl.resolution,
    },
  };
}

/**
 * Convert dB gain to a linear multiplier (10^(dB/20)). The worker's
 * `bg_music_volume` expects a linear value in [0, 2].
 */
export function gainDbToLinear(db: number): number {
  const clamped = Math.max(-30, Math.min(db, 6));
  const linear = Math.pow(10, clamped / 20);
  return Math.max(0, Math.min(linear, 2));
}
