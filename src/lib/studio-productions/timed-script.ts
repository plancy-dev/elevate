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
