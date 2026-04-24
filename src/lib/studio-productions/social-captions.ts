/**
 * Platform-specific caption data + LLM prompt builder.
 *
 * We generate Instagram / TikTok / YouTube Shorts captions in one LLM call,
 * returning strict JSON. Hashtag counts and length caps follow each
 * platform's widely-reported best practice:
 *
 *   - Instagram : <= 150 chars body, 8 hashtags, emojis allowed
 *   - TikTok    : <= 100 chars body, 5 hashtags, punchy hook
 *   - YouTube   : 60-char title + 200-char description, "#Shorts" included
 */
export const SOCIAL_CAPTION_PLATFORMS = ["instagram", "tiktok", "youtube"] as const;
export type SocialCaptionPlatform = (typeof SOCIAL_CAPTION_PLATFORMS)[number];

export type SocialCaptions = {
  instagram: string;
  tiktok: string;
  youtube: { title: string; description: string };
};

export type SocialCaptionMeta = {
  topic: string;
  /**
   * Plain script text — the LLM anchors captions on this, rather than the
   * packaging draft alone, so they stay faithful to what's actually spoken.
   */
  script: string;
  /** Optional hook / lead line (first seconds of the video). */
  hook?: string;
  /** Optional working title. */
  workingTitle?: string;
  /** Target user-facing locale for caption copy (keeps the script language). */
  localeHint?: string;
  /** Optional channel persona / brand voice. */
  brandVoice?: string;
};

export function buildSocialCaptionUserMessage(meta: SocialCaptionMeta): string {
  const lines: string[] = [
    "Write social captions for a short vertical AI video in JSON only.",
    'Output must parse as: {"instagram": string, "tiktok": string, "youtube": {"title": string, "description": string}}.',
    "Keep the spoken script's language. Do not translate.",
    "",
    "## instagram rules",
    "- <= 150 characters body, natural emojis allowed (1-3 max).",
    "- Exactly 8 hashtags at the end, grouped with single spaces.",
    "- No misleading claims.",
    "",
    "## tiktok rules",
    "- <= 100 characters body, strong hook up front, no preamble.",
    "- Exactly 5 hashtags at the end.",
    "- Do not include '@' mentions.",
    "",
    "## youtube rules",
    "- title: <= 60 characters, front-load hook keyword, include '#Shorts' at the end only if it still fits.",
    "- description: 2-3 short lines, <= 200 characters total. First line paraphrases the hook.",
    "- Never promise content not in the script.",
    "",
    `## topic: ${meta.topic || "(unspecified)"}`,
  ];
  if (meta.workingTitle?.trim()) {
    lines.push(`## working_title: ${meta.workingTitle.trim()}`);
  }
  if (meta.hook?.trim()) {
    lines.push(`## hook: ${meta.hook.trim()}`);
  }
  if (meta.brandVoice?.trim()) {
    lines.push(`## brand_voice: ${meta.brandVoice.trim()}`);
  }
  if (meta.localeHint?.trim()) {
    lines.push(`## locale_hint: ${meta.localeHint.trim()}`);
  }
  lines.push("", "## script", meta.script.slice(0, 8000));
  return lines.join("\n");
}

export const SOCIAL_CAPTION_SYSTEM_PROMPT =
  "You are a short-form social media caption specialist. Output valid JSON only, no commentary. Comply with each platform's community guidelines and never invent content not supported by the script.";

/**
 * Parse the LLM reply into a strict SocialCaptions object. Returns null on
 * malformed input so callers can surface a retry code instead of surfacing
 * raw LLM text.
 */
export function parseSocialCaptions(raw: string): SocialCaptions | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Tolerate fenced code blocks.
  const jsonStart = trimmed.indexOf("{");
  const jsonEnd = trimmed.lastIndexOf("}");
  if (jsonStart < 0 || jsonEnd < jsonStart) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed.slice(jsonStart, jsonEnd + 1));
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const o = parsed as Record<string, unknown>;
  const instagram = typeof o.instagram === "string" ? o.instagram.trim() : "";
  const tiktok = typeof o.tiktok === "string" ? o.tiktok.trim() : "";
  const yt = o.youtube;
  if (!instagram || !tiktok || !yt || typeof yt !== "object") return null;
  const ytObj = yt as Record<string, unknown>;
  const title = typeof ytObj.title === "string" ? ytObj.title.trim() : "";
  const description =
    typeof ytObj.description === "string" ? ytObj.description.trim() : "";
  if (!title || !description) return null;

  return { instagram, tiktok, youtube: { title, description } };
}

/** Clamp a caption body to its platform limit without breaking mid-word. */
export function clampCaption(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const truncated = text.slice(0, maxChars).replace(/\s+\S*$/, "");
  return (truncated || text.slice(0, maxChars)).trim();
}

/** Convert the LLM JSON into the per-platform plain text Buffer will post. */
export function renderPlatformCaption(
  platform: SocialCaptionPlatform,
  captions: SocialCaptions,
): string {
  if (platform === "instagram") return clampCaption(captions.instagram, 2200);
  if (platform === "tiktok") return clampCaption(captions.tiktok, 2200);
  return `${captions.youtube.title}\n\n${captions.youtube.description}`;
}
