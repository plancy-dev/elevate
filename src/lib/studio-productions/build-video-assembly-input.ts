import type { Json } from "@/types/database.types";
import { parseSceneRows } from "@/lib/studio-productions/scene-rows-json";
import { buildSceneWorldRanges } from "@/lib/studio-productions/scene-timeline";
import {
  parseSceneClipMetadata,
  type SceneClipMetadata,
} from "@/lib/studio-productions/scene-clip-metadata";
import type {
  PerSceneAssemblyClip,
  VideoAssemblyJobInput,
} from "@/lib/studio-productions/video-assembly-job-input";

type ArtifactRow = {
  artifact_role: string;
  external_url: string | null;
  sort_order: number | null;
  metadata: Json;
};

function clipForSceneRow(
  rowIndex: number,
  position: number,
  clips: ArtifactRow[],
): ArtifactRow | null {
  const byMeta = clips.find((c) => {
    const m = parseSceneClipMetadata(c.metadata, -1);
    return m?.scene_index === rowIndex;
  });
  if (byMeta?.external_url) return byMeta;
  return clips[position] ?? null;
}

/**
 * When scene plan JSON exists and each planned scene has a matching clip, build per-scene assembly payload.
 */
export function buildPerSceneAssemblyClips(
  scenesJson: string,
  clipArtifacts: ArtifactRow[],
): PerSceneAssemblyClip[] | null {
  const rows = parseSceneRows(scenesJson);
  if (!rows?.length) return null;

  const clips = clipArtifacts
    .filter((a) => a.artifact_role === "scene_clip" && a.external_url)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  if (clips.length === 0) return null;

  const sortedRows = [...rows].sort((a, b) => a.index - b.index);
  const ranges = buildSceneWorldRanges(sortedRows);
  const rangeByIndex = new Map(ranges.map((r) => [r.index, r]));

  const out: PerSceneAssemblyClip[] = [];
  for (let i = 0; i < sortedRows.length; i++) {
    const row = sortedRows[i]!;
    const art = clipForSceneRow(row.index, i, clips);
    if (!art?.external_url) return null;
    const meta = parseSceneClipMetadata(art.metadata, row.index) as SceneClipMetadata | null;
    const rng = rangeByIndex.get(row.index);
    if (!rng) return null;
    const target = meta?.target_duration_sec ?? row.durationSeconds;
    const trim = meta?.source === "upload" ? (meta.trim_start_sec ?? 0) : 0;
    const loop = meta?.source !== "upload" ? true : meta.loop !== false;
    out.push({
      clip_url: art.external_url,
      target_duration_sec: target,
      trim_start_sec: trim,
      loop,
      world_start_sec: rng.worldStartSec,
    });
  }

  return out.length === sortedRows.length ? out : null;
}

export function mergeVideoAssemblyJobInput(
  base: Omit<VideoAssemblyJobInput, "per_scene">,
  scenesJson: string,
  clipArtifacts: ArtifactRow[],
): VideoAssemblyJobInput {
  const per = buildPerSceneAssemblyClips(scenesJson, clipArtifacts);
  if (per?.length) {
    return { ...base, per_scene: per };
  }
  return { ...base, per_scene: null };
}

export function scenesJsonFromEpisodePipelinePrefs(root: Json | null | undefined): string {
  if (root === null || root === undefined || typeof root !== "object" || Array.isArray(root)) {
    return "";
  }
  const sr = (root as Record<string, Json>).sceneRender;
  if (sr === null || typeof sr !== "object" || Array.isArray(sr)) return "";
  const sj = (sr as Record<string, unknown>).scenesJson;
  return typeof sj === "string" ? sj : "";
}
