/**
 * Resolve ffmpeg/ffprobe executables. Dev servers often miss Homebrew PATH; set FFMPEG_PATH / FFPROBE_PATH.
 *
 * Do not add `import "server-only"` here: the Fly/Docker worker runs this file via `tsx` outside the Next
 * bundler, and the `server-only` package throws when loaded in plain Node.
 */
export function resolveFfmpegBinary(): string {
  const p = process.env.FFMPEG_PATH?.trim();
  return p && p.length > 0 ? p : "ffmpeg";
}

export function resolveFfprobeBinary(): string {
  const p = process.env.FFPROBE_PATH?.trim();
  return p && p.length > 0 ? p : "ffprobe";
}
