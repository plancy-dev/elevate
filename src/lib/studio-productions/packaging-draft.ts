/**
 * Parsed `packaging_draft` artifact JSON (LLM output from studio-pipeline-presteps).
 */
export type PackagingDraftFields = {
  youtube_title: string;
  youtube_description: string;
  thumbnail_image_prompt: string;
};

export function parsePackagingDraftContent(text: string): PackagingDraftFields | null {
  try {
    const cleaned = text
      .replace(/^```json\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    const o = JSON.parse(cleaned) as Record<string, unknown>;
    const youtube_title =
      typeof o.youtube_title === "string" ? o.youtube_title : "";
    const youtube_description =
      typeof o.youtube_description === "string" ? o.youtube_description : "";
    const thumbnail_image_prompt =
      typeof o.thumbnail_image_prompt === "string"
        ? o.thumbnail_image_prompt
        : "";
    if (!youtube_title && !youtube_description && !thumbnail_image_prompt) {
      return null;
    }
    return { youtube_title, youtube_description, thumbnail_image_prompt };
  } catch {
    return null;
  }
}
