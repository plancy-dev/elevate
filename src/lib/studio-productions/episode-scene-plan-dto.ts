import type { Json } from "@/types/database.types";
import { scenesJsonFromEpisodePipelinePrefs } from "@/lib/studio-productions/build-video-assembly-input";
import {
  parseSceneRows,
  type SceneRow,
} from "@/lib/studio-productions/scene-rows-json";

/** Serializable scene plan row (from `pipeline_prefs.sceneRender.scenesJson`). */
export type EpisodeScenePlanRow = SceneRow;

/**
 * Parse persisted scene plan from episode `pipeline_prefs` for SSR → client DTO.
 * Returns `null` when there is no valid non-empty plan (same rules as `parseSceneRows`).
 */
export function scenePlanRowsFromPipelinePrefs(
  root: Json | null | undefined,
): EpisodeScenePlanRow[] | null {
  const raw = scenesJsonFromEpisodePipelinePrefs(root).trim();
  if (!raw) return null;
  return parseSceneRows(raw);
}
