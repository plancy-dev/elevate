/**
 * Build an initial `EditorDslV3` from whatever artifacts the episode has
 * today. Used when the user opens the editor for the first time (no
 * `pipeline_prefs.editor` yet) or when they click "reset to scenes".
 */
import type { StudioProductionArtifactRow } from "@/lib/data/studio-productions";
import {
  DEFAULT_OVERLAY_STYLE,
  EDITOR_DSL_DEFAULT_RESOLUTION,
  EDITOR_DSL_VERSION,
  type EditorDslV3,
  type EditorScene,
} from "@/lib/studio-productions/editor-dsl";
import type { EpisodeFormat } from "@/lib/studio-productions/episode-format";
import { parseSceneClipMetadata } from "@/lib/studio-productions/scene-clip-metadata";
import type { SceneRow } from "@/lib/studio-productions/scene-rows-json";

function randomId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Returns the freshest `scene_clip` artifact per `scene_index`. When two
 * artifacts share an index (e.g. Runway I2V re-render), the newer one wins.
 */
export function pickLatestSceneClipsByIndex(
  artifacts: StudioProductionArtifactRow[],
): Map<number, StudioProductionArtifactRow> {
  const byIndex = new Map<number, StudioProductionArtifactRow>();
  const ordered = [...artifacts]
    .filter((a) => a.artifact_role === "scene_clip" && !!a.external_url)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  for (const a of ordered) {
    const meta = parseSceneClipMetadata(a.metadata, 0);
    if (!meta) continue;
    if (!byIndex.has(meta.scene_index)) {
      byIndex.set(meta.scene_index, a);
    }
  }
  return byIndex;
}

function pickLatestArtifact(
  artifacts: StudioProductionArtifactRow[],
  role: string,
): StudioProductionArtifactRow | null {
  const candidates = artifacts
    .filter((a) => a.artifact_role === role)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  return candidates[0] ?? null;
}

export type BootstrapEditorDslOptions = {
  episodeId: string;
  format: EpisodeFormat;
  scenePlan: SceneRow[] | null;
  artifacts: StudioProductionArtifactRow[];
};

/**
 * Build the initial DSL. Scenes without a rendered `scene_clip` fall back to
 * an empty `sourceUrl` — the editor UI will surface that as "scene not
 * rendered yet" and disable preview for it.
 */
export function bootstrapEditorDsl(
  opts: BootstrapEditorDslOptions,
): EditorDslV3 {
  const clipsByIndex = pickLatestSceneClipsByIndex(opts.artifacts);
  const scenes: EditorScene[] = [];

  const plan = opts.scenePlan ?? [];
  const orderedPlan = [...plan].sort((a, b) => a.index - b.index);

  for (const row of orderedPlan) {
    const clip = clipsByIndex.get(row.index);
    const clipMeta = clip ? parseSceneClipMetadata(clip.metadata, row.index) : null;
    scenes.push({
      id: randomId("scene"),
      sourceArtifactId: clip?.id ?? "",
      sourceUrl: clip?.external_url ?? "",
      targetDurationSec: row.durationSeconds,
      trimStartSec: clipMeta?.trim_start_sec ?? 0,
      loop: clipMeta?.loop ?? false,
      transitionToNextMs: 0,
    });
  }

  // Fallback: when there's no plan yet but there are clips (legacy), order
  // by metadata.scene_index.
  if (scenes.length === 0 && clipsByIndex.size > 0) {
    const indices = [...clipsByIndex.keys()].sort((a, b) => a - b);
    for (const i of indices) {
      const clip = clipsByIndex.get(i)!;
      const meta = parseSceneClipMetadata(clip.metadata, i);
      scenes.push({
        id: randomId("scene"),
        sourceArtifactId: clip.id,
        sourceUrl: clip.external_url ?? "",
        targetDurationSec: meta?.target_duration_sec ?? 5,
        trimStartSec: meta?.trim_start_sec ?? 0,
        loop: meta?.loop ?? false,
        transitionToNextMs: 0,
      });
    }
  }

  const narrationArtifact = pickLatestArtifact(opts.artifacts, "tts_audio");

  const totalDurationSec = scenes.reduce(
    (sum, s) => sum + s.targetDurationSec,
    0,
  );

  return {
    version: EDITOR_DSL_VERSION,
    episodeId: opts.episodeId,
    format: opts.format,
    resolution: EDITOR_DSL_DEFAULT_RESOLUTION[opts.format],
    totalDurationSec: Math.max(totalDurationSec, 1),
    scenes,
    overlays: [],
    audio: {
      narration: narrationArtifact?.external_url
        ? {
            artifactId: narrationArtifact.id,
            url: narrationArtifact.external_url,
            gainDb: 0,
          }
        : null,
      bgm: null,
    },
    updatedAt: new Date().toISOString(),
  };
}

/** Shared default overlay factory the client store uses when adding cards. */
export function makeDefaultOverlay(atSec: number, endAtSec: number) {
  return {
    id: randomId("overlay"),
    kind: "text" as const,
    text: "New text",
    startSec: Math.max(0, atSec),
    endSec: Math.max(atSec + 1, endAtSec),
    position: "bottom" as const,
    style: DEFAULT_OVERLAY_STYLE,
    animation: "fade_in" as const,
    animationDurationSec: 0.3,
  };
}
