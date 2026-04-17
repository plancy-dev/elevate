/**
 * Slice SRT subtitle content by a world-time window [windowStartSec, windowEndSec)
 * and shift cues so the first cue starts at 0 local time.
 */

export type SrtCue = {
  index: number;
  startSec: number;
  endSec: number;
  text: string;
};

/** Parse SRT timestamps; supports HH:MM:SS,mmm or MM:SS,mmm */
function parseSrtTime(s: string): number | null {
  const t = s.trim();
  const parts = t.split(":");
  if (parts.length === 3) {
    const h = Number(parts[0]);
    const m = Number(parts[1]);
    const secMs = parts[2].split(",");
    const sec = Number(secMs[0]);
    const ms = secMs[1] != null ? Number(secMs[1]) : 0;
    if (![h, m, sec, ms].every((x) => Number.isFinite(x))) return null;
    return h * 3600 + m * 60 + sec + ms / 1000;
  }
  if (parts.length === 2) {
    const m = Number(parts[0]);
    const secMs = parts[1].split(",");
    const sec = Number(secMs[0]);
    const ms = secMs[1] != null ? Number(secMs[1]) : 0;
    if (![m, sec, ms].every((x) => Number.isFinite(x))) return null;
    return m * 60 + sec + ms / 1000;
  }
  return null;
}

function formatSrtTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) sec = 0;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.round((sec - Math.floor(sec)) * 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}

/** Loose SRT parser: blocks separated by blank lines. */
export function parseSrt(content: string): SrtCue[] {
  const lines = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const cues: SrtCue[] = [];
  let i = 0;
  while (i < lines.length) {
    while (i < lines.length && lines[i].trim() === "") i++;
    if (i >= lines.length) break;
    const indexLine = lines[i].trim();
    i++;
    if (!/^\d+$/.test(indexLine)) {
      continue;
    }
    const idx = Number.parseInt(indexLine, 10);
    if (i >= lines.length) break;
    const timeLine = lines[i].trim();
    i++;
    const arrow = timeLine.includes("-->") ? "-->" : "→";
    const parts = timeLine.split(arrow);
    if (parts.length < 2) continue;
    const start = parseSrtTime(parts[0] ?? "");
    const endPart = (parts[1] ?? "").trim();
    const endChunk = endPart.split(/\s+/)[0] ?? "";
    const end = parseSrtTime(endChunk);
    if (start == null || end == null) continue;
    const textLines: string[] = [];
    while (i < lines.length && lines[i].trim() !== "") {
      textLines.push(lines[i]);
      i++;
    }
    cues.push({
      index: idx,
      startSec: start,
      endSec: end,
      text: textLines.join("\n").trim(),
    });
  }
  return cues;
}

function overlapsWindow(cue: SrtCue, winStart: number, winEnd: number): boolean {
  return cue.endSec > winStart && cue.startSec < winEnd;
}

/**
 * Keep cues overlapping [windowStartSec, windowEndSec), clamp to window, subtract windowStartSec.
 */
export function sliceSrtToLocalWindow(
  srtContent: string,
  windowStartSec: number,
  windowEndSec: number,
): string {
  const cues = parseSrt(srtContent);
  const out: string[] = [];
  let n = 1;
  for (const cue of cues) {
    if (!overlapsWindow(cue, windowStartSec, windowEndSec)) continue;
    const start = Math.max(cue.startSec, windowStartSec) - windowStartSec;
    const end = Math.min(cue.endSec, windowEndSec) - windowStartSec;
    if (end <= start + 0.02) continue;
    out.push(String(n));
    n++;
    out.push(`${formatSrtTime(start)} --> ${formatSrtTime(end)}`);
    out.push(cue.text);
    out.push("");
  }
  return out.join("\n").trimEnd();
}
