/**
 * FFmpeg-based video assembly for YouTube Shorts production.
 * Concatenates scene clips, overlays TTS audio, burns in SRT subtitles.
 * Outputs a 9:16 H.264/AAC MP4.
 *
 * Requires `ffmpeg` binary accessible on the process (Next.js server, or the assembly worker).
 */

import { execFile } from "node:child_process";
import { writeFile, unlink, mkdtemp, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { promisify } from "node:util";

import { resolveFfmpegBinary } from "@/lib/studio-productions/ffmpeg-binary";
import {
  buildSubtitlesFilterChainSegment,
  escapeConcatFilePath,
  ffmpegAvailable,
  probeDurationSeconds,
  SCALE_PAD_1080X1920,
} from "@/lib/studio-productions/ffmpeg-common";
import { buildOverlayFilterGraph } from "@/lib/studio-productions/ffmpeg-overlay-filter";
import type { EditorOverlay } from "@/lib/studio-productions/editor-dsl";

const execFileAsync = promisify(execFile);

export type AssemblyInput = {
  clipUrls: string[];
  audioUrl?: string;
  srtContent?: string;
  bgMusicUrl?: string;
  bgMusicVolume?: number;
  /**
   * Optional editor DSL v3 extensions. When present, extra `drawtext`
   * filters are chained on top of the base concat. Scene-level cross-fades
   * and per-track gain are intentionally not wired here yet — they live in
   * the per-scene variant and PR S8's export path.
   */
  overlays?: EditorOverlay[];
};

export type AssemblyResult =
  | { ok: true; outputBuffer: Buffer; durationSeconds: number }
  | { ok: false; code: "no_clips" | "ffmpeg_not_found" | "ffmpeg_error"; message?: string };

export async function downloadToFile(url: string, filePath: string): Promise<void> {
  if (url.startsWith("data:")) {
    const base64Part = url.split(",")[1];
    if (!base64Part) throw new Error("Invalid data URI");
    await writeFile(filePath, Buffer.from(base64Part, "base64"));
    return;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(filePath, buf);
}

/**
 * Build and execute an FFmpeg pipeline to assemble a Shorts video.
 *
 * Pipeline:
 * 1. Download all clips and audio to temp dir
 * 2. Create concat file for clips
 * 3. Merge clips, overlay audio, burn subtitles
 * 4. Output 9:16 H.264 MP4
 */
export async function assembleVideo(
  input: AssemblyInput,
): Promise<AssemblyResult> {
  if (input.clipUrls.length === 0) {
    return { ok: false, code: "no_clips" };
  }

  if (!(await ffmpegAvailable())) {
    const hint = process.env.FFMPEG_PATH
      ? `FFMPEG_PATH=${process.env.FFMPEG_PATH}`
      : "Install ffmpeg (e.g. brew install ffmpeg) or set FFMPEG_PATH to the binary.";
    return {
      ok: false,
      code: "ffmpeg_not_found",
      message: `ffmpeg not executable (${hint})`,
    };
  }

  const workDir = await mkdtemp(join(tmpdir(), "elevate-assembly-"));
  const tempFiles: string[] = [];

  try {
    const clipPaths: string[] = [];
    for (let i = 0; i < input.clipUrls.length; i++) {
      const p = join(workDir, `clip_${i}.mp4`);
      await downloadToFile(input.clipUrls[i], p);
      clipPaths.push(p);
      tempFiles.push(p);
    }

    const concatFile = join(workDir, "concat.txt");
    const concatContent = clipPaths
      .map((p) => `file '${escapeConcatFilePath(p)}'`)
      .join("\n");
    await writeFile(concatFile, concatContent);
    tempFiles.push(concatFile);

    let audioPath: string | undefined;
    if (input.audioUrl) {
      audioPath = join(workDir, "audio.mp3");
      await downloadToFile(input.audioUrl, audioPath);
      tempFiles.push(audioPath);
    }

    let srtPath: string | undefined;
    if (input.srtContent) {
      srtPath = join(workDir, "subtitles.srt");
      await writeFile(srtPath, input.srtContent);
      tempFiles.push(srtPath);
    }

    let bgMusicPath: string | undefined;
    if (input.bgMusicUrl) {
      bgMusicPath = join(workDir, "bgmusic.mp3");
      await downloadToFile(input.bgMusicUrl, bgMusicPath);
      tempFiles.push(bgMusicPath);
    }

    const outputPath = join(workDir, "output.mp4");
    tempFiles.push(outputPath);

    const ffmpegArgs = buildFfmpegArgs({
      concatFile,
      audioPath,
      srtPath,
      bgMusicPath,
      bgMusicVolume: input.bgMusicVolume ?? 0.15,
      outputPath,
      overlays: input.overlays ?? [],
    });

    await execFileAsync(resolveFfmpegBinary(), ffmpegArgs, {
      timeout: 300_000,
      maxBuffer: 50 * 1024 * 1024,
    });

    const outputBuffer = await readFile(outputPath);

    const durationSeconds = await probeDurationSeconds(outputPath, 10_000);

    return { ok: true, outputBuffer, durationSeconds };
  } catch (err) {
    return {
      ok: false,
      code: "ffmpeg_error",
      message: err instanceof Error ? err.message : String(err),
    };
  } finally {
    for (const f of tempFiles) {
      await unlink(f).catch(() => {});
    }
  }
}

type FfmpegBuildArgs = {
  concatFile: string;
  audioPath?: string;
  srtPath?: string;
  bgMusicPath?: string;
  bgMusicVolume: number;
  outputPath: string;
  overlays: EditorOverlay[];
};

function buildFfmpegArgs(opts: FfmpegBuildArgs): string[] {
  const args: string[] = ["-y"];

  args.push("-f", "concat", "-safe", "0", "-i", opts.concatFile);

  if (opts.audioPath) {
    args.push("-i", opts.audioPath);
  }

  if (opts.bgMusicPath) {
    args.push("-i", opts.bgMusicPath);
  }

  const filterParts: string[] = [];
  let videoStream = "[0:v]";
  let audioStream: string | undefined;

  filterParts.push(`${videoStream}${SCALE_PAD_1080X1920}[vscaled]`);
  videoStream = "[vscaled]";

  if (opts.srtPath) {
    filterParts.push(`${videoStream}${buildSubtitlesFilterChainSegment(opts.srtPath)}[vsub]`);
    videoStream = "[vsub]";
  }

  if (opts.overlays.length > 0) {
    // Strip the surrounding "[]" so we can splice drawtext onto the current
    // video stream without breaking the chain.
    const inputLabel = videoStream.replace(/^\[|\]$/g, "");
    const outputLabel = "voverlay";
    const graph = buildOverlayFilterGraph(opts.overlays, {
      inputLabel,
      outputLabel,
    });
    if (graph) {
      filterParts.push(graph);
      videoStream = `[${outputLabel}]`;
    }
  }

  if (opts.audioPath && opts.bgMusicPath) {
    const vol = opts.bgMusicVolume;
    const bgIdx = opts.audioPath ? 2 : 1;
    filterParts.push(`[${bgIdx}:a]volume=${vol}[bglow]`);
    filterParts.push(`[1:a][bglow]amix=inputs=2:duration=first[amixed]`);
    audioStream = "[amixed]";
  } else if (opts.audioPath) {
    audioStream = "1:a";
  }

  if (filterParts.length > 0) {
    args.push("-filter_complex", filterParts.join(";"));
    args.push("-map", videoStream);
    if (audioStream) {
      args.push("-map", audioStream);
    }
  }

  args.push(
    "-c:v", "libx264",
    "-preset", "fast",
    "-crf", "23",
    "-c:a", "aac",
    "-b:a", "128k",
    "-movflags", "+faststart",
    "-shortest",
    opts.outputPath,
  );

  return args;
}

