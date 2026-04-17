/**
 * Validate user-supplied scenes JSON for Runway scene render (no zod dep).
 */
import "server-only";

import type { SceneDefinition } from "@/lib/studio-productions/scene-splitter";

const MAX_SCENES = 12;
const MIN_DURATION = 2;
const MAX_DURATION = 10;

export type ScenesJsonValidationResult =
  | { ok: true; scenes: SceneDefinition[] }
  | { ok: false; error: "studioSceneRenderInvalidJson" | "studioSceneRenderScenesInvalid" };

function clampDuration(n: unknown): number {
  if (typeof n !== "number" || !Number.isFinite(n)) return 5;
  const x = Math.round(n);
  return Math.min(MAX_DURATION, Math.max(MIN_DURATION, x));
}

/**
 * Validates an array of `{ narration, visual_prompt, duration? }` and maps to SceneDefinition.
 */
export function validateAndParseScenesJsonArray(raw: unknown): ScenesJsonValidationResult {
  if (!Array.isArray(raw)) {
    return { ok: false, error: "studioSceneRenderScenesInvalid" };
  }
  if (raw.length === 0 || raw.length > MAX_SCENES) {
    return { ok: false, error: "studioSceneRenderScenesInvalid" };
  }

  const scenes: SceneDefinition[] = [];

  for (let i = 0; i < raw.length; i++) {
    const row = raw[i];
    if (typeof row !== "object" || row === null || Array.isArray(row)) {
      return { ok: false, error: "studioSceneRenderScenesInvalid" };
    }
    const o = row as Record<string, unknown>;
    const narrationRaw =
      typeof o.narration === "string"
        ? o.narration
        : typeof o.voiceover === "string"
          ? o.voiceover
          : typeof o.line === "string"
            ? o.line
            : "";
    const narration = narrationRaw.trim();
    const visual =
      typeof o.visual_prompt === "string"
        ? o.visual_prompt.trim()
        : typeof o.visualPrompt === "string"
          ? o.visualPrompt.trim()
          : typeof o.visual === "string"
            ? o.visual.trim()
            : "";
    if (!narration || !visual) {
      return { ok: false, error: "studioSceneRenderScenesInvalid" };
    }
    const durRaw = [o.duration, o.duration_seconds, o.durationSeconds].find(
      (x) => typeof x === "number" && Number.isFinite(x),
    );
    scenes.push({
      index: i,
      narration,
      visualPrompt: visual,
      durationSeconds: clampDuration(durRaw),
    });
  }

  return { ok: true, scenes };
}

export function safeParseScenesJsonString(json: string): ScenesJsonValidationResult {
  try {
    const parsed = JSON.parse(json) as unknown;
    return validateAndParseScenesJsonArray(parsed);
  } catch {
    return { ok: false, error: "studioSceneRenderInvalidJson" };
  }
}
