import type { EpisodeFormat } from "@/lib/studio-productions/episode-format";

/** Snapshot stored in `studio_video_assembly_jobs.input` (JSON). */
export type VideoAssemblyJobInput = {
  clip_urls: string[];
  audio_url: string | null;
  srt_content: string | null;
  bg_music_url: string | null;
  bg_music_volume: number | null;
  episode_format: EpisodeFormat;
};

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
  return true;
}
