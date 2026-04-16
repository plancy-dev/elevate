/**
 * Heuristic timed script: split plain script into blocks with [mm:ss] labels.
 *
 * Paragraphs:
 * - Prefer blank-line breaks (`\n\n+`) — “real” paragraphs in editors.
 * - If there is only one blob, split on single newlines — common when pasting KO/JA
 *   (one line break between paragraphs, no blank line).
 * - Fallback: Latin sentence boundaries.
 *
 * Durations: Latin ~2.5 words/sec; CJK / unspaced text uses glyph count (~6 chars/sec);
 * minimum 3s per block so TTS/assembly has usable segment lengths.
 */
const WORDS_PER_SECOND = 2.5;
/** Unspaced narration (CJK etc.): rough chars per second for pacing */
const GLYPHS_PER_SECOND = 6;
const MIN_BLOCK_SECONDS = 3;

function secondsForText(block: string): number {
  const trimmedBlock = block.trim();
  if (!trimmedBlock) return MIN_BLOCK_SECONDS;

  const words = trimmedBlock.split(/\s+/).filter(Boolean).length;
  const glyphs = trimmedBlock.replace(/\s/g, "").length;

  const fromWords = words / WORDS_PER_SECOND;
  const fromGlyphs = glyphs / GLYPHS_PER_SECOND;
  const raw = Math.max(fromWords, fromGlyphs);
  return Math.max(MIN_BLOCK_SECONDS, Math.round(raw));
}

/** Split script into segment strings (one timed block each). Exported for tests. */
export function splitScriptIntoTimedBlocks(scriptText: string): string[] {
  const trimmed = scriptText.trim();
  if (!trimmed) return [];

  const byDouble = trimmed
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (byDouble.length > 1) return byDouble;

  const bySingle = trimmed
    .split(/\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (bySingle.length > 1) return bySingle;

  if (byDouble.length === 1) {
    const sentencePieces = byDouble[0]
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (sentencePieces.length > 1) return sentencePieces;
    return [byDouble[0]];
  }

  return [trimmed];
}

export function buildTimedScriptFromPlainScript(scriptText: string): string {
  const blocks = splitScriptIntoTimedBlocks(scriptText);
  if (blocks.length === 0) return "";

  let elapsed = 0;
  const lines: string[] = [];

  for (const block of blocks) {
    const mm = Math.floor(elapsed / 60);
    const ss = elapsed % 60;
    const stamp = `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
    lines.push(`[${stamp}] ${block}`);
    elapsed += secondsForText(block);
  }

  return lines.join("\n\n");
}

/** One segment from LLM JSON (`start_sec` = seconds from t=0). */
export type TimedScriptLlmSegment = {
  readonly start_sec: number;
  readonly text: string;
};

/**
 * Turn LLM segments into the same `[mm:ss] text` format as {@link buildTimedScriptFromPlainScript}.
 */
export function formatTimedScriptFromLlmSegments(
  segments: readonly TimedScriptLlmSegment[],
): string {
  const sorted = [...segments].sort((a, b) => a.start_sec - b.start_sec);
  const lines: string[] = [];
  for (const s of sorted) {
    const t = Math.max(0, Math.floor(Number(s.start_sec)));
    const text = String(s.text ?? "").trim();
    if (!text) continue;
    const mm = Math.floor(t / 60);
    const ss = t % 60;
    const stamp = `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
    lines.push(`[${stamp}] ${text}`);
  }
  return lines.join("\n\n");
}

/**
 * Parse LLM output JSON: `{"segments":[{"start_sec":0,"text":"..."}]}`.
 * Accepts optional ```json fences. Returns formatted timed script or null.
 */
export function parseTimedScriptLlmJson(raw: string): string | null {
  let obj: unknown;
  try {
    const trimmed = raw.trim();
    const jsonStr = trimmed.startsWith("```")
      ? trimmed
          .replace(/^```(?:json)?\s*/i, "")
          .replace(/\s*```\s*$/u, "")
          .trim()
      : trimmed;
    obj = JSON.parse(jsonStr);
  } catch {
    return null;
  }
  if (!obj || typeof obj !== "object") return null;
  const segments = (obj as { segments?: unknown }).segments;
  if (!Array.isArray(segments) || segments.length === 0) return null;

  const out: TimedScriptLlmSegment[] = [];
  for (const item of segments) {
    if (!item || typeof item !== "object") continue;
    const startRaw = (item as { start_sec?: unknown }).start_sec;
    const textRaw = (item as { text?: unknown }).text;
    const start_sec = Number(startRaw);
    const text = String(textRaw ?? "").trim();
    if (!Number.isFinite(start_sec) || !text) continue;
    out.push({ start_sec: Math.max(0, Math.floor(start_sec)), text });
  }
  if (out.length === 0) return null;

  return formatTimedScriptFromLlmSegments(out);
}
