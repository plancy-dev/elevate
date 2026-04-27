/**
 * Per-scene video normalization (trim/loop, 9:16), per-scene SRT burn-in,
 * concat video; TTS sliced by world timeline; optional BGM mix.
 */

import { execFile } from "node:child_process";
import { writeFile, unlink, mkdtemp, readFile, rm } from "node:fs/promises";
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
import { sliceSrtToLocalWindow } from "@/lib/studio-productions/srt-slice";
import { downloadToFile } from "@/lib/studio-productions/video-assembly";
import type { PerSceneAssemblyClip } from "@/lib/studio-productions/video-assembly-job-input";

const execFileAsync = promisify(execFile);

export type PerSceneClipSpec = {
  clipUrl: string;
  targetDurationSec: number;
  trimStartSec: number;
  loop: boolean;
  worldStartSec: number;
};

export function perSceneJobClipsToSpecs(clips: PerSceneAssemblyClip[]): PerSceneClipSpec[] {
  return clips.map((p) => ({
    clipUrl: p.clip_url,
    targetDurationSec: p.target_duration_sec,
    trimStartSec: p.trim_start_sec,
    loop: p.loop,
    worldStartSec: p.world_start_sec,
  }));
}

export type AssembleVideoPerSceneInput = {
  scenes: PerSceneClipSpec[];
  audioUrl?: string;
  srtContent?: string;
  bgMusicUrl?: string;
  bgMusicVolume?: number;
  /**
   * Optional editor DSL v3 overlays. Applied as a second FFmpeg pass on the
   * finished file so the per-scene copy-codec fast path remains intact.
   */
  overlays?: import("@/lib/studio-productions/editor-dsl").EditorOverlay[];
};

export type AssembleVideoPerSceneResult =
  | { ok: true; outputBuffer: Buffer; durationSeconds: number }
  | {
      ok: false;
      code: "no_scenes" | "ffmpeg_not_found" | "ffmpeg_error";
      message?: string;
    };

function isDrawtextUnavailableError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return /No such filter:\s*'drawtext'/.test(err.message);
}

/**
 * Normalize one scene clip to exact duration, optional local SRT burn-in, video-only h264.
 */
async function normalizeOneScene(opts: {
  workDir: string;
  index: number;
  inputPath: string;
  targetSec: number;
  trimStart: number;
  loop: boolean;
  localSrtPath?: string;
  tempFiles: string[];
}): Promise<string> {
  const {
    workDir,
    index,
    inputPath,
    targetSec,
    trimStart,
    loop,
    localSrtPath,
    tempFiles,
  } = opts;
  const outPath = join(workDir, `norm_${index}.mp4`);
  tempFiles.push(outPath);

  const probed = await probeDurationSeconds(inputPath);
  const available = Math.max(0, probed - trimStart);
  if (available <= 0.05) {
    throw new Error(`scene_${index}_too_short_after_trim`);
  }
  if (!loop && available < targetSec - 0.05) {
    throw new Error(`scene_${index}_needs_loop_or_shorter_target`);
  }

  let vf = SCALE_PAD_1080X1920;
  if (localSrtPath) {
    vf = `${SCALE_PAD_1080X1920},${buildSubtitlesFilterChainSegment(localSrtPath)}`;
  }

  const args: string[] = ["-y"];
  if (trimStart > 0) {
    args.push("-ss", String(trimStart));
  }
  if (loop && available < targetSec - 0.05) {
    args.push("-stream_loop", "-1");
  }
  args.push("-i", inputPath);
  args.push("-t", String(targetSec));
  args.push("-an");
  args.push("-vf", vf);
  args.push("-c:v", "libx264", "-preset", "fast", "-crf", "23", "-pix_fmt", "yuv420p", outPath);

  await execFileAsync(resolveFfmpegBinary(), args, {
    timeout: 300_000,
    maxBuffer: 50 * 1024 * 1024,
  });
  return outPath;
}

async function concatVideoFiles(
  paths: string[],
  workDir: string,
  tempFiles: string[],
): Promise<string> {
  const concatFile = join(workDir, "vconcat.txt");
  const body = paths.map((p) => `file '${escapeConcatFilePath(p)}'`).join("\n");
  await writeFile(concatFile, body);
  tempFiles.push(concatFile);
  const out = join(workDir, "video_concat.mp4");
  tempFiles.push(out);
  await execFileAsync(
    resolveFfmpegBinary(),
    ["-y", "-f", "concat", "-safe", "0", "-i", concatFile, "-c", "copy", out],
    { timeout: 300_000, maxBuffer: 20 * 1024 * 1024 },
  );
  return out;
}

async function sliceAndConcatTts(opts: {
  workDir: string;
  ttsPath: string;
  scenes: PerSceneClipSpec[];
  tempFiles: string[];
}): Promise<string> {
  const { workDir, ttsPath, scenes, tempFiles } = opts;
  const ttsTotal = await probeDurationSeconds(ttsPath);
  if (ttsTotal <= 0) {
    throw new Error("tts_probe_zero");
  }

  const parts: string[] = [];
  for (let i = 0; i < scenes.length; i++) {
    const s = scenes[i];
    const start = s.worldStartSec;
    const dur = s.targetDurationSec;
    const partPath = join(workDir, `tts_${i}.m4a`);
    tempFiles.push(partPath);

    const available = Math.max(0, ttsTotal - start);
    const take = Math.min(dur, available);

    if (take <= 0.02) {
      await execFileAsync(
        resolveFfmpegBinary(),
        [
          "-y",
          "-f",
          "lavfi",
          "-i",
          "anullsrc=r=44100:cl=stereo",
          "-t",
          String(dur),
          "-c:a",
          "aac",
          "-b:a",
          "128k",
          partPath,
        ],
        { timeout: 60_000, maxBuffer: 10 * 1024 * 1024 },
      );
    } else if (take >= dur - 0.05) {
      await execFileAsync(
        resolveFfmpegBinary(),
        [
          "-y",
          "-i",
          ttsPath,
          "-ss",
          String(start),
          "-t",
          String(dur),
          "-c:a",
          "aac",
          "-b:a",
          "128k",
          partPath,
        ],
        { timeout: 120_000, maxBuffer: 20 * 1024 * 1024 },
      );
    } else {
      const chunk = join(workDir, `tts_chunk_${i}.m4a`);
      tempFiles.push(chunk);
      await execFileAsync(
        resolveFfmpegBinary(),
        [
          "-y",
          "-i",
          ttsPath,
          "-ss",
          String(start),
          "-t",
          String(take),
          "-c:a",
          "aac",
          "-b:a",
          "128k",
          chunk,
        ],
        { timeout: 120_000, maxBuffer: 20 * 1024 * 1024 },
      );
      const padSec = dur - take;
      await execFileAsync(
        resolveFfmpegBinary(),
        [
          "-y",
          "-i",
          chunk,
          "-af",
          `apad=pad_dur=${padSec}`,
          "-t",
          String(dur),
          "-c:a",
          "aac",
          "-b:a",
          "128k",
          partPath,
        ],
        { timeout: 120_000, maxBuffer: 20 * 1024 * 1024 },
      );
    }
    parts.push(partPath);
  }

  if (parts.length === 1) return parts[0]!;

  const list = join(workDir, "audio_concat.txt");
  tempFiles.push(list);
  await writeFile(
    list,
    parts.map((p) => `file '${escapeConcatFilePath(p)}'`).join("\n"),
  );
  const out = join(workDir, "tts_concat.m4a");
  tempFiles.push(out);
  await execFileAsync(
    resolveFfmpegBinary(),
    ["-y", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", out],
    { timeout: 300_000, maxBuffer: 20 * 1024 * 1024 },
  );
  return out;
}

export async function assembleVideoPerScene(
  input: AssembleVideoPerSceneInput,
): Promise<AssembleVideoPerSceneResult> {
  if (input.scenes.length === 0) {
    return { ok: false, code: "no_scenes" };
  }
  if (!(await ffmpegAvailable())) {
    return {
      ok: false,
      code: "ffmpeg_not_found",
      message: "ffmpeg not executable",
    };
  }

  const workDir = await mkdtemp(join(tmpdir(), "elevate-assembly-v2-"));
  const tempFiles: string[] = [];

  try {
    const normPaths: string[] = [];

    for (let i = 0; i < input.scenes.length; i++) {
      const sc = input.scenes[i];
      const rawPath = join(workDir, `in_${i}.bin`);
      tempFiles.push(rawPath);
      await downloadToFile(sc.clipUrl, rawPath);

      let localSrt: string | undefined;
      if (input.srtContent?.trim()) {
        const ws = sc.worldStartSec;
        const we = ws + sc.targetDurationSec;
        const slice = sliceSrtToLocalWindow(input.srtContent, ws, we);
        if (slice.trim()) {
          localSrt = join(workDir, `scene_${i}.srt`);
          tempFiles.push(localSrt);
          await writeFile(localSrt, slice, "utf8");
        }
      }

      const norm = await normalizeOneScene({
        workDir,
        index: i,
        inputPath: rawPath,
        targetSec: sc.targetDurationSec,
        trimStart: sc.trimStartSec,
        loop: sc.loop,
        localSrtPath: localSrt,
        tempFiles,
      });
      normPaths.push(norm);
    }

    const videoConcatPath = await concatVideoFiles(normPaths, workDir, tempFiles);

    const outputPath = join(workDir, "output.mp4");
    tempFiles.push(outputPath);

    if (input.audioUrl?.trim()) {
      const ttsPath = join(workDir, "tts_full.mp3");
      tempFiles.push(ttsPath);
      await downloadToFile(input.audioUrl, ttsPath);
      const audioMerged = await sliceAndConcatTts({
        workDir,
        ttsPath,
        scenes: input.scenes,
        tempFiles,
      });

      if (input.bgMusicUrl?.trim()) {
        const bgPath = join(workDir, "bgm.mp3");
        tempFiles.push(bgPath);
        await downloadToFile(input.bgMusicUrl, bgPath);
        const vol = input.bgMusicVolume ?? 0.15;
        await execFileAsync(
          resolveFfmpegBinary(),
          [
            "-y",
            "-i",
            videoConcatPath,
            "-i",
            audioMerged,
            "-i",
            bgPath,
            "-filter_complex",
            `[2:a]volume=${vol}[bg];[1:a][bg]amix=inputs=2:duration=first[aout]`,
            "-map",
            "0:v:0",
            "-map",
            "[aout]",
            "-c:v",
            "copy",
            "-c:a",
            "aac",
            "-b:a",
            "128k",
            "-movflags",
            "+faststart",
            "-shortest",
            outputPath,
          ],
          { timeout: 300_000, maxBuffer: 50 * 1024 * 1024 },
        );
      } else {
        await execFileAsync(
          resolveFfmpegBinary(),
          [
            "-y",
            "-i",
            videoConcatPath,
            "-i",
            audioMerged,
            "-map",
            "0:v:0",
            "-map",
            "1:a:0",
            "-c:v",
            "copy",
            "-c:a",
            "aac",
            "-b:a",
            "128k",
            "-movflags",
            "+faststart",
            "-shortest",
            outputPath,
          ],
          { timeout: 300_000, maxBuffer: 50 * 1024 * 1024 },
        );
      }
    } else {
      await execFileAsync(
        resolveFfmpegBinary(),
        [
          "-y",
          "-i",
          videoConcatPath,
          "-c:v",
          "copy",
          "-an",
          "-movflags",
          "+faststart",
          outputPath,
        ],
        { timeout: 300_000, maxBuffer: 50 * 1024 * 1024 },
      );
    }

    // Second pass: apply editor overlays (drawtext chain) on the finished
    // file. Skipping re-encode when no overlays keeps the fast path intact.
    const overlays = input.overlays ?? [];
    let finalPath = outputPath;
    if (overlays.length > 0) {
      const { buildOverlayFilterGraph } = await import(
        "@/lib/studio-productions/ffmpeg-overlay-filter"
      );
      const overlayedPath = join(workDir, "output_overlayed.mp4");
      tempFiles.push(overlayedPath);
      const graph = buildOverlayFilterGraph(overlays, {
        inputLabel: "0:v",
        outputLabel: "vout",
      });
      if (graph) {
        try {
          await execFileAsync(
            resolveFfmpegBinary(),
            [
              "-y",
              "-i",
              outputPath,
              "-filter_complex",
              graph,
              "-map",
              "[vout]",
              "-map",
              "0:a?",
              "-c:v",
              "libx264",
              "-preset",
              "fast",
              "-crf",
              "23",
              "-c:a",
              "copy",
              "-movflags",
              "+faststart",
              overlayedPath,
            ],
            { timeout: 300_000, maxBuffer: 50 * 1024 * 1024 },
          );
          finalPath = overlayedPath;
        } catch (overlayErr) {
          // Some ffmpeg builds omit drawtext support. Degrade gracefully by
          // returning the non-overlayed render instead of failing export.
          if (!isDrawtextUnavailableError(overlayErr)) {
            throw overlayErr;
          }
        }
      }
    }

    const outputBuffer = await readFile(finalPath);
    const durationSeconds = await probeDurationSeconds(finalPath);
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
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}
