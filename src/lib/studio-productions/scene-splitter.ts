/**
 * Split a script draft into discrete scenes for video generation.
 * Each scene gets a visual prompt that can be sent to Runway independently.
 *
 * Two modes:
 * 1. LLM-generated: script already contains `scenes[]` from buildDraftPrompt
 * 2. Heuristic: split by paragraphs/sentences and generate visual prompts
 */
import "server-only";

export type SceneDefinition = {
  index: number;
  narration: string;
  visualPrompt: string;
  durationSeconds: number;
};

export type SceneSplitResult = {
  scenes: SceneDefinition[];
  totalDuration: number;
};

const WORDS_PER_SECOND = 2.5;
const MIN_SCENE_DURATION = 3;
const MAX_SCENE_DURATION = 8;

function estimateDuration(text: string): number {
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const raw = wordCount / WORDS_PER_SECOND;
  return Math.max(MIN_SCENE_DURATION, Math.min(MAX_SCENE_DURATION, Math.round(raw)));
}

/**
 * Parse LLM-generated scenes from JSON output.
 * Expected shape: { scenes: [{ narration, visual_prompt, duration? }] }
 */
export function parseLlmScenes(
  scenesJson: Array<{ narration: string; visual_prompt: string; duration?: number }>,
): SceneSplitResult {
  const scenes: SceneDefinition[] = scenesJson.map((s, i) => ({
    index: i,
    narration: s.narration,
    visualPrompt: s.visual_prompt,
    durationSeconds: s.duration ?? estimateDuration(s.narration),
  }));

  return {
    scenes,
    totalDuration: scenes.reduce((sum, s) => sum + s.durationSeconds, 0),
  };
}

/**
 * Heuristic split: break script by double newlines or sentence boundaries.
 * Generate simple visual prompts from the narration text.
 */
export function splitScriptToScenes(
  scriptText: string,
  targetSceneCount?: number,
): SceneSplitResult {
  const paragraphs = scriptText
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  let chunks: string[];
  if (paragraphs.length >= 3) {
    chunks = paragraphs;
  } else {
    const sentences = scriptText
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const target = targetSceneCount ?? Math.max(3, Math.min(8, Math.ceil(sentences.length / 2)));
    const perChunk = Math.ceil(sentences.length / target);
    chunks = [];
    for (let i = 0; i < sentences.length; i += perChunk) {
      chunks.push(sentences.slice(i, i + perChunk).join(""));
    }
  }

  const scenes: SceneDefinition[] = chunks.map((chunk, i) => ({
    index: i,
    narration: chunk,
    visualPrompt: buildVisualPromptFromNarration(chunk, i),
    durationSeconds: estimateDuration(chunk),
  }));

  return {
    scenes,
    totalDuration: scenes.reduce((sum, s) => sum + s.durationSeconds, 0),
  };
}

/** Exported for Runway scenes derived from TTS segment timings. */
export function buildVisualPromptFromNarration(narration: string, index: number): string {
  const prefix = index === 0
    ? "Opening shot, cinematic, vertical 9:16 format."
    : `Scene ${index + 1}, cinematic continuation, vertical 9:16 format.`;

  const cleaned = narration
    .replace(/[#*_~`]/g, "")
    .slice(0, 400);

  return `${prefix}Visual representation of: ${cleaned}`;
}
