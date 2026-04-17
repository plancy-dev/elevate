/**
 * Resolve ffmpeg/ffprobe executables. Dev servers often miss Homebrew PATH; set FFMPEG_PATH / FFPROBE_PATH.
 */
import "server-only";

export function resolveFfmpegBinary(): string {
  const p = process.env.FFMPEG_PATH?.trim();
  return p && p.length > 0 ? p : "ffmpeg";
}

export function resolveFfprobeBinary(): string {
  const p = process.env.FFPROBE_PATH?.trim();
  return p && p.length > 0 ? p : "ffprobe";
}
