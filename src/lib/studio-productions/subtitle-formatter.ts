/**
 * Subtitle formatters: TtsSegment[] → WebVTT / SRT strings.
 *
 * WebVTT (W3C): YouTube-native, `.` ms separator, WEBVTT header.
 * SRT (SubRip): legacy compat, `,` ms separator, sequential index.
 *
 * Deep-research reference: "타임코드 WebVTT는 . 구분자, SRT는 , 구분자".
 * Line-wrap: ≤42 chars/line, max 2 lines per cue (readability).
 */
import type { TtsSegment } from "@/lib/studio-productions/tts-chunked-pipeline";

const MAX_LINE_CHARS = 42;
const MAX_LINES = 2;

function formatVttTimestamp(ms: number): string {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  const frac = ms % 1000;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(frac).padStart(3, "0")}`;
}

function formatSrtTimestamp(ms: number): string {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  const frac = ms % 1000;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(frac).padStart(3, "0")}`;
}

/** Wrap text into lines of ≤MAX_LINE_CHARS, up to MAX_LINES. */
function wrapCueText(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= MAX_LINE_CHARS) return trimmed;

  const words = trimmed.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > MAX_LINE_CHARS && current) {
      lines.push(current);
      current = word;
      if (lines.length >= MAX_LINES) break;
    } else {
      current = candidate;
    }
  }
  if (current && lines.length < MAX_LINES) {
    lines.push(current);
  }

  return lines.join("\n");
}

export function segmentsToWebVtt(segments: TtsSegment[]): string {
  const lines = ["WEBVTT", ""];
  for (const seg of segments) {
    const start = formatVttTimestamp(seg.startMs);
    const end = formatVttTimestamp(seg.endMs);
    lines.push(`${start} --> ${end}`);
    lines.push(wrapCueText(seg.text));
    lines.push("");
  }
  return lines.join("\n");
}

export function segmentsToSrt(segments: TtsSegment[]): string {
  const lines: string[] = [];
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const start = formatSrtTimestamp(seg.startMs);
    const end = formatSrtTimestamp(seg.endMs);
    lines.push(String(i + 1));
    lines.push(`${start} --> ${end}`);
    lines.push(wrapCueText(seg.text));
    lines.push("");
  }
  return lines.join("\n");
}
