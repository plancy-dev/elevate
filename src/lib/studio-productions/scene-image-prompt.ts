/**
 * Scene image prompt builder (ADR-009 §4).
 *
 * Produces a single prompt string that every image provider adapter can
 * consume as-is. Structure:
 *
 *   1. IDENTITY LOCK block (Character Bible summary)
 *   2. Scene description + visual prompt
 *   3. Style / safety directives (brand palette hint, no text/logo, no watermark)
 *   4. Aspect ratio suffix (adapters may also send it as a structured param)
 *
 * The builder is pure and has no server-only imports so it can be unit-tested
 * and potentially reused in client previews.
 */
import type { CharacterBible } from "@/lib/studio-productions/character-bible";
import type { ImageAspectRatio } from "@/lib/studio-integrations/providers/images/types";

export type BuildSceneImagePromptOptions = {
  bible: CharacterBible | null | undefined;
  /**
   * Short scene description (e.g. SceneRow.narration or a human-readable
   * summary of what happens in the scene).
   */
  sceneDescription: string;
  /** Visual prompt produced by the scene LLM planner. */
  visualPrompt: string;
  aspectRatio: ImageAspectRatio;
  /**
   * Whether a Master Reference Image will also be sent to the provider. When
   * true, the IDENTITY LOCK block leans on the image instead of restating the
   * bible verbatim.
   */
  hasReferenceImage: boolean;
};

function buildIdentityLock(
  bible: CharacterBible | null | undefined,
  hasReferenceImage: boolean,
): string[] {
  if (!bible) return [];
  const lines: string[] = [];
  const name = bible.name;
  const fragments: string[] = [];

  if (bible.age != null) fragments.push(`age ${bible.age}`);
  if (bible.appearance?.ethnicity) fragments.push(bible.appearance.ethnicity);
  if (bible.appearance?.hair) fragments.push(bible.appearance.hair + " hair");
  if (bible.appearance?.eyes) fragments.push(bible.appearance.eyes + " eyes");
  if (bible.appearance?.skin) fragments.push(bible.appearance.skin + " skin");
  if (bible.wardrobe) fragments.push(`wardrobe: ${bible.wardrobe}`);
  if (bible.style) fragments.push(`style: ${bible.style}`);

  if (bible.color_palette) {
    const colors = [
      bible.color_palette.primary,
      bible.color_palette.secondary,
      bible.color_palette.accent,
    ].filter(Boolean);
    if (colors.length > 0) {
      fragments.push(`color palette: ${colors.join(", ")}`);
    }
  }

  if (bible.extras) {
    for (const [k, v] of Object.entries(bible.extras)) {
      fragments.push(`${k}: ${v}`);
    }
  }

  if (fragments.length === 0 && !name) {
    return [];
  }

  lines.push("IDENTITY LOCK (must stay consistent across every generation):");
  if (name) {
    lines.push(`- subject name: ${name}`);
  }
  for (const frag of fragments) {
    lines.push(`- ${frag}`);
  }
  if (hasReferenceImage) {
    lines.push(
      "- match the reference image above for facial features, hair, and wardrobe.",
    );
  }
  return lines;
}

export function buildSceneImagePrompt(
  opts: BuildSceneImagePromptOptions,
): string {
  const sections: string[] = [];

  const identity = buildIdentityLock(opts.bible, opts.hasReferenceImage);
  if (identity.length > 0) {
    sections.push(identity.join("\n"));
  }

  const sceneBlock: string[] = ["SCENE:"];
  if (opts.sceneDescription.trim()) {
    sceneBlock.push(`- description: ${opts.sceneDescription.trim()}`);
  }
  if (opts.visualPrompt.trim()) {
    sceneBlock.push(`- visual: ${opts.visualPrompt.trim()}`);
  }
  sections.push(sceneBlock.join("\n"));

  sections.push(
    [
      "STYLE RULES:",
      "- ultra photo-realistic, cinematic, shallow depth of field",
      "- single clear subject, no on-image text, no captions, no logos, no watermarks",
      "- natural or cinematic lighting (no over-HDR)",
      `- target aspect ratio: ${opts.aspectRatio}`,
    ].join("\n"),
  );

  return sections.join("\n\n");
}
