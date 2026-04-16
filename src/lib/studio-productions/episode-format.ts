/**
 * Resolve whether an episode targets Shorts (vertical) or longform (horizontal).
 *
 * Decision hierarchy:
 * 1. distribution_label preset → explicit mapping
 * 2. Linked channel platform → fallback
 * 3. Default → "shorts" (preserves existing behaviour)
 *
 * Deep-research reference:
 * - Shorts: 9:16, 1080×1920, max 180s (2024.10+ policy)
 * - Longform: 16:9, 1920×1080, no hard max
 */

export type EpisodeFormat = "shorts" | "longform";

export const FORMAT_SPECS = {
  shorts: {
    ratio: "720:1280" as const,
    resolution: "1080x1920" as const,
    maxSeconds: 180,
    thumbnailSize: "1792x1024" as const,
    aspectLabel: "9:16",
  },
  longform: {
    ratio: "1280:720" as const,
    resolution: "1920x1080" as const,
    maxSeconds: null,
    thumbnailSize: "1792x1024" as const,
    aspectLabel: "16:9",
  },
} as const;

const SHORTS_LABELS = new Set([
  "youtube_shorts",
  "instagram_reels",
  "tiktok",
]);

const LONGFORM_LABELS = new Set([
  "youtube_long",
  "linkedin",
  "website_other",
]);

const SHORTS_PLATFORMS = new Set([
  "youtube_shorts",
  "instagram_reels",
  "tiktok",
]);

/**
 * Resolve format from episode data. Accepts partial objects so callers
 * don't need the full row type.
 */
export function resolveEpisodeFormat(episode: {
  distribution_label?: string | null;
  studio_distribution_channels?: {
    platform?: string | null;
  } | null;
}): EpisodeFormat {
  const label = (episode.distribution_label ?? "").trim();

  if (SHORTS_LABELS.has(label)) return "shorts";
  if (LONGFORM_LABELS.has(label)) return "longform";

  const platform = episode.studio_distribution_channels?.platform ?? "";
  if (SHORTS_PLATFORMS.has(platform)) return "shorts";
  if (platform === "youtube_long") return "longform";

  return "shorts";
}
