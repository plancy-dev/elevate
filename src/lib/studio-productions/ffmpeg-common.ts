import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { resolveFfmpegBinary, resolveFfprobeBinary } from "@/lib/studio-productions/ffmpeg-binary";

const execFileAsync = promisify(execFile);

/** 9:16 normalization for Shorts-style output. */
export const SCALE_PAD_1080X1920 =
  "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2";

export function escapeConcatFilePath(path: string): string {
  return path.replace(/'/g, "'\\''");
}

/** libass / fontconfig family name — must exist on the host. */
export function resolvedSubtitleFontName(): string {
  return process.env.VIDEO_ASSEMBLY_SUBTITLE_FONT?.trim() || "Noto Sans CJK KR";
}

export function buildSubtitlesFilterChainSegment(srtPath: string): string {
  const escapedPath = srtPath.replace(/'/g, "'\\''").replace(/:/g, "\\:");
  const font = resolvedSubtitleFontName();
  const fontsdir = process.env.VIDEO_ASSEMBLY_SUBTITLE_FONTSDIR?.trim();
  const style = `FontSize=24,Fontname=${font},PrimaryColour=&HFFFFFF,OutlineColour=&H000000,Outline=2,Alignment=2,MarginV=80`;
  const base = `subtitles='${escapedPath}':charenc=UTF-8:force_style='${style}'`;
  if (!fontsdir) return base;
  const escDir = fontsdir.replace(/'/g, "'\\''").replace(/:/g, "\\:");
  return `subtitles='${escapedPath}':fontsdir='${escDir}':charenc=UTF-8:force_style='${style}'`;
}

export async function ffmpegAvailable(): Promise<boolean> {
  try {
    await execFileAsync(resolveFfmpegBinary(), ["-version"], { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

export async function probeDurationSeconds(
  filePath: string,
  timeoutMs = 15_000,
): Promise<number> {
  try {
    const { stdout } = await execFileAsync(
      resolveFfprobeBinary(),
      [
        "-v",
        "quiet",
        "-show_entries",
        "format=duration",
        "-of",
        "default=noprint_wrappers=1:nokey=1",
        filePath,
      ],
      { timeout: timeoutMs },
    );
    return parseFloat(stdout.trim()) || 0;
  } catch {
    return 0;
  }
}

