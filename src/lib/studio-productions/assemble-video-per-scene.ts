/**
 * Per-scene video normalization (trim/loop, 9:16), per-scene SRT burn-in,
 * concat video; TTS sliced by world timeline; optional BGM mix.
 */

import { execFile } from "node:child_process";
import { writeFile, unlink, mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { promisify } from "node:util";

import { resolveFfmpegBinary, resolveFfprobeBinary } from "@/lib/studio-productions/ffmpeg-binary";
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
};

export type AssembleVideoPerSceneResult =
  | { ok: true; outputBuffer: Buffer; durationSeconds: number }
  | {
      ok: false;
      code:
        | "no_scenes"
        | "ffmpeg_not_found"
        | "ffmpeg_error"
        | "download_failed"
        | "probe_failed";
      message?: string;
    };

async function ffmpegAvailable(): Promise<boolean> {
  try {
    await execFileAsync(resolveFfmpegBinary(), ["-version"], { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

async function probeDurationSeconds(filePath: string): Promise<number> {
  try {
    const { stdout } = await execFileAsync(resolveFfprobeBinary(), [
      "-v",
      "quiet",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      filePath,
    ], { timeout: 15_000 });
    return parseFloat(stdout.trim()) || 0;
  } catch {
    return 0;
  }
}

function resolvedSubtitleFontName(): string {
  return process.env.VIDEO_ASSEMBLY_SUBTITLE_FONT?.trim() || "Noto Sans CJK KR";
}

function buildSubtitlesFilterChainSegment(srtPath: string): string {
  const escapedPath = srtPath.replace(/'/g, "'\\''").replace(/:/g, "\\:");
  const font = resolvedSubtitleFontName();
  const fontsdir = process.env.VIDEO_ASSEMBLY_SUBTITLE_FONTSDIR?.trim();
  const style = `FontSize=24,Fontname=${font},PrimaryColour=&HFFFFFF,OutlineColour=&H000000,Outline=2,Alignment=2,MarginV=80`;
  const base = `subtitles='${escapedPath}':charenc=UTF-8:force_style='${style}'`;
  if (!fontsdir) return base;
  const escDir = fontsdir.replace(/'/g, "'\\''").replace(/:/g, "\\:");
  return `subtitles='${escapedPath}':fontsdir='${escDir}':charenc=UTF-8:force_style='${style}'`;
}

const SCALE_PAD =
  "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2";

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

  let vf = SCALE_PAD;
  if (localSrtPath) {
    vf = `${SCALE_PAD},${buildSubtitlesFilterChainSegment(localSrtPath)}`;
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
  const body = paths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join("\n");
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
    parts.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join("\n"),
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

    const outputBuffer = await readFile(outputPath);
    const durationSeconds = await probeDurationSeconds(outputPath);
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
