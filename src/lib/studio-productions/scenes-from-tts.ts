/**
 * Build Runway scene definitions from chunked TTS segment timings + the same script blocks
 * used for TTS ({@link splitScriptIntoTimedBlocks}). Aligns clip target duration with spoken
 * segment length (clamped to Runway gen4.5 2–10s), instead of heuristic 3–8s per paragraph.
 */
import "server-only";

import { splitScriptIntoTimedBlocks } from "@/lib/studio-productions/timed-script";
import {
  buildVisualPromptFromNarration,
  type SceneDefinition,
} from "@/lib/studio-productions/scene-splitter";

const RUNWAY_MIN_SEC = 2;
const RUNWAY_MAX_SEC = 10;
/** Merge consecutive TTS segments until ~this wall-clock (ms) to limit Runway API calls. */
const MERGE_TARGET_MAX_MS = 9000;

export type TtsSegmentTiming = { startMs: number; endMs: number };

/**
 * Parse ElevenLabs chunked TTS metadata.segments rows `{ i, t, s, e }`.
 */
export function parseTtsSegmentTimings(metadata: unknown): TtsSegmentTiming[] | null {
  if (!metadata || typeof metadata !== "object") return null;
  const raw = (metadata as Record<string, unknown>).segments;
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const out: TtsSegmentTiming[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") return null;
    const o = row as Record<string, unknown>;
    const s = Number(o.s);
    const e = Number(o.e);
    if (!Number.isFinite(s) || !Number.isFinite(e)) return null;
    out.push({ startMs: s, endMs: e });
  }
  return out;
}

function clampRunwaySeconds(ms: number): number {
  const sec = Math.round(ms / 1000);
  return Math.max(RUNWAY_MIN_SEC, Math.min(RUNWAY_MAX_SEC, sec));
}

/**
 * When TTS was chunked, pair {@link splitScriptIntoTimedBlocks}(script) with segment timings
 * and merge into fewer Runway clips so total wall time tracks narration better.
 */
export function buildScenesFromTtsTimings(
  scriptText: string,
  segmentTimings: TtsSegmentTiming[],
): SceneDefinition[] | null {
  const blocks = splitScriptIntoTimedBlocks(scriptText);
  if (blocks.length === 0) return null;
  if (blocks.length !== segmentTimings.length) return null;

  const scenes: SceneDefinition[] = [];
  let i = 0;
  while (i < blocks.length) {
    const texts: string[] = [];
    let accMs = 0;
    while (i < blocks.length) {
      const segMs = Math.max(
        0,
        segmentTimings[i].endMs - segmentTimings[i].startMs,
      );
      const wouldBe = accMs + segMs;
      if (texts.length > 0 && wouldBe > MERGE_TARGET_MAX_MS) break;
      texts.push(blocks[i]);
      accMs = wouldBe;
      i++;
      if (accMs >= MERGE_TARGET_MAX_MS) break;
    }
    if (texts.length === 0) continue;

    const narration = texts.join("\n\n");
    const idx = scenes.length;
    scenes.push({
      index: idx,
      narration,
      visualPrompt: buildVisualPromptFromNarration(narration, idx),
      durationSeconds: clampRunwaySeconds(accMs),
    });
  }

  return scenes.length > 0 ? scenes : null;
}
