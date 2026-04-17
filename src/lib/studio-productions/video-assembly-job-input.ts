import type { EpisodeFormat } from "@/lib/studio-productions/episode-format";

/** Per-scene clip for v2 assembly (trim/loop, world-timed TTS/SRT). */
export type PerSceneAssemblyClip = {
  clip_url: string;
  target_duration_sec: number;
  trim_start_sec: number;
  loop: boolean;
  world_start_sec: number;
};

/** Snapshot stored in `studio_video_assembly_jobs.input` (JSON). */
export type VideoAssemblyJobInput = {
  clip_urls: string[];
  audio_url: string | null;
  srt_content: string | null;
  bg_music_url: string | null;
  bg_music_volume: number | null;
  episode_format: EpisodeFormat;
  /** When set, worker runs per-scene normalization + timed subs + TTS slice. */
  per_scene?: PerSceneAssemblyClip[] | null;
};

function isPerSceneClip(v: unknown): v is PerSceneAssemblyClip {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.clip_url === "string" &&
    typeof o.target_duration_sec === "number" &&
    typeof o.trim_start_sec === "number" &&
    typeof o.loop === "boolean" &&
    typeof o.world_start_sec === "number"
  );
}

export function isVideoAssemblyJobInput(v: unknown): v is VideoAssemblyJobInput {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  if (!Array.isArray(o.clip_urls) || !o.clip_urls.every((x) => typeof x === "string")) {
    return false;
  }
  if (o.audio_url != null && typeof o.audio_url !== "string") {
    return false;
  }
  if (o.srt_content != null && typeof o.srt_content !== "string") {
    return false;
  }
  if (o.bg_music_url != null && typeof o.bg_music_url !== "string") {
    return false;
  }
  if (o.bg_music_volume != null && typeof o.bg_music_volume !== "number") {
    return false;
  }
  if (o.episode_format !== "shorts" && o.episode_format !== "longform") {
    return false;
  }
  if (o.per_scene === undefined || o.per_scene === null) {
    return true;
  }
  if (!Array.isArray(o.per_scene) || !o.per_scene.every(isPerSceneClip)) {
    return false;
  }
  return true;
}

/** Scene count for metadata: v2 uses `per_scene.length` when present, else legacy `clip_urls.length`. */
export function effectiveAssemblyClipCount(input: VideoAssemblyJobInput): number {
  const n = input.per_scene?.length ?? 0;
  if (n > 0) return n;
  return input.clip_urls.length;
}
