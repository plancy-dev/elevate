/**
 * Client-safe parse of episode scene plan JSON (same shape as server `resolveEpisodeScenes`).
 */

export type SceneRow = {
  index: number;
  narration: string;
  visualPrompt: string;
  durationSeconds: number;
};

export function parseSceneRows(payload: string): SceneRow[] | null {
  try {
    const raw = JSON.parse(payload) as unknown;
    if (!Array.isArray(raw)) return null;
    const out: SceneRow[] = [];
    for (const item of raw) {
      if (typeof item !== "object" || item === null) return null;
      const o = item as Record<string, unknown>;
      const index = typeof o.index === "number" && Number.isFinite(o.index) ? o.index : -1;
      const narration = typeof o.narration === "string" ? o.narration : "";
      const visualPrompt =
        typeof o.visualPrompt === "string"
          ? o.visualPrompt
          : typeof o.visual_prompt === "string"
            ? o.visual_prompt
            : "";
      const dur =
        typeof o.durationSeconds === "number"
          ? o.durationSeconds
          : typeof o.duration_seconds === "number"
            ? o.duration_seconds
            : 5;
      if (index < 0 || !narration.trim() || !visualPrompt.trim()) return null;
      out.push({ index, narration, visualPrompt, durationSeconds: dur });
    }
    out.sort((a, b) => a.index - b.index);
    return out;
  } catch {
    return null;
  }
}
