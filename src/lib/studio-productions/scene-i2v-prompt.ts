/**
 * Scene image-to-video prompt builder (ADR-009 §7).
 *
 * Runway 4.5+ recommends no negative prompts, single-scene focus, and 30–80
 * word prompt bodies. This builder composes:
 *
 *   1. IDENTITY LOCK block from Character Bible (shared with scene image
 *      prompt builder — but kept separate here so copy can drift per call).
 *   2. Scene action / camera movement description.
 *   3. Optional "end-state" fragment when the model cannot accept a Last
 *      Frame via the structured API.
 */
import type { CharacterBible } from "@/lib/studio-productions/character-bible";

export type BuildSceneI2VPromptOptions = {
  bible: CharacterBible | null | undefined;
  sceneDescription: string;
  /**
   * Scene-level visual prompt (e.g. from the scene planner). Used as the
   * primary action + camera description. Truncated aggressively.
   */
  visualPrompt: string;
  /** Optional user-supplied description of the end state. */
  endStateHint?: string;
  /**
   * If false, the builder merges the `endStateHint` into the prompt body so
   * the model can interpret it textually.
   */
  modelSupportsLastFrame: boolean;
};

function identitySummary(bible: CharacterBible | null | undefined): string {
  if (!bible) return "";
  const parts: string[] = [];
  if (bible.name) parts.push(bible.name);
  if (bible.appearance?.ethnicity) parts.push(bible.appearance.ethnicity);
  if (bible.appearance?.hair) parts.push(bible.appearance.hair + "hair");
  if (bible.wardrobe) parts.push(bible.wardrobe);
  if (bible.style) parts.push(bible.style);
  return parts.join(",");
}

function countWords(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Ensure the prompt stays within Runway's sweet spot (≈30–80 words) by
 * trimming trailing sentences if over budget. Never returns empty.
 */
function clampWordCount(s: string, max: number): string {
  const words = s.trim().split(/\s+/);
  if (words.length <= max) return s.trim();
  return words.slice(0, max).join("");
}

export function buildSceneI2VPrompt(opts: BuildSceneI2VPromptOptions): string {
  const sections: string[] = [];

  const identity = identitySummary(opts.bible);
  if (identity) {
    sections.push(`Subject: ${identity}.`);
  }

  if (opts.sceneDescription.trim()) {
    sections.push(opts.sceneDescription.trim());
  }

  if (opts.visualPrompt.trim()) {
    sections.push(opts.visualPrompt.trim());
  }

  if (!opts.modelSupportsLastFrame && opts.endStateHint?.trim()) {
    sections.push(`End state: ${opts.endStateHint.trim()}`);
  }

  sections.push(
    "Cinematic, shallow depth of field. Natural lighting. Subtle motion. No on-image text.",
  );

  const combined = sections.join("");
  const clamped = clampWordCount(combined, 80);
  // Runway sweet spot is 30-80 words; we do not enforce a minimum because
  // shorter, cleaner prompts still work. Return verbatim.
  return countWords(clamped) === 0 ? "A single continuous scene." : clamped;
}
