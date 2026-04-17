/**
 * Derive scene list for an episode (shared by prepare + render actions).
 */
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { splitScriptToScenes, type SceneDefinition } from "@/lib/studio-productions/scene-splitter";
import {
  buildScenesFromTtsTimings,
  parseTtsSegmentTimings,
} from "@/lib/studio-productions/scenes-from-tts";
import {
  validateAndParseScenesJsonArray,
} from "@/lib/studio-productions/scenes-json-validate";

export type ResolveEpisodeScenesInput = {
  supabase: SupabaseClient<Database>;
  episodeId: string;
  organizationId: string;
  scriptText: string;
  scenesJsonRaw: string;
  targetSceneCount?: number;
};

export type ResolveEpisodeScenesResult =
  | { ok: true; scenes: SceneDefinition[] }
  | { ok: false; error: string };

export async function resolveEpisodeScenes(
  input: ResolveEpisodeScenesInput,
): Promise<ResolveEpisodeScenesResult> {
  const {
    supabase,
    episodeId,
    organizationId,
    scriptText,
    scenesJsonRaw,
    targetSceneCount,
  } = input;

  let scenes: SceneDefinition[];

  const { data: ttsRows } = await supabase
    .from("studio_production_artifacts")
    .select("metadata")
    .eq("episode_id", episodeId)
    .eq("organization_id", organizationId)
    .eq("artifact_role", "tts_audio")
    .order("created_at", { ascending: false })
    .limit(1);

  const ttsTimings = parseTtsSegmentTimings(ttsRows?.[0]?.metadata);
  const scenesFromTts =
    scriptText && ttsTimings
      ? buildScenesFromTtsTimings(scriptText, ttsTimings)
      : null;

  if (scenesJsonRaw.trim()) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(scenesJsonRaw) as unknown;
    } catch {
      return { ok: false, error: "studioSceneRenderInvalidJson" };
    }
    const arr = Array.isArray(parsed)
      ? parsed
      : typeof parsed === "object" &&
          parsed !== null &&
          Array.isArray((parsed as { scenes?: unknown }).scenes)
        ? (parsed as { scenes: unknown[] }).scenes
        : null;
    if (!arr) {
      return { ok: false, error: "studioSceneRenderScenesInvalid" };
    }
    const validated = validateAndParseScenesJsonArray(arr);
    if (!validated.ok) {
      return { ok: false, error: validated.error };
    }
    scenes = validated.scenes;
  } else if (scenesFromTts) {
    scenes = scenesFromTts;
  } else if (scriptText.trim()) {
    scenes = splitScriptToScenes(scriptText, targetSceneCount).scenes;
  } else {
    return { ok: false, error: "studioSceneRenderNoScript" };
  }

  if (scenes.length === 0) {
    return { ok: false, error: "studioSceneRenderNoScenes" };
  }

  return { ok: true, scenes };
}

/** Parse scenes_json string only (for LLM output path). */
export function parseScenesJsonStrict(json: string): ResolveEpisodeScenesResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json) as unknown;
  } catch {
    return { ok: false, error: "studioSceneRenderInvalidJson" };
  }
  const arr = Array.isArray(parsed)
    ? parsed
    : typeof parsed === "object" &&
        parsed !== null &&
        Array.isArray((parsed as { scenes?: unknown }).scenes)
      ? (parsed as { scenes: unknown[] }).scenes
      : null;
  if (!arr) return { ok: false, error: "studioSceneRenderScenesInvalid" };
  const v = validateAndParseScenesJsonArray(arr);
  if (!v.ok) return { ok: false, error: v.error };
  return { ok: true, scenes: v.scenes };
}
