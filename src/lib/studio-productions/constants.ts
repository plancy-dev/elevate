/** Max length for artifact prompt/script body (aligned with safe text handling). */
export const STUDIO_CONTENT_TEXT_MAX = 32_000;

/** Rough cap for JSON stringified metadata stored in jsonb. */
export const STUDIO_METADATA_JSON_MAX_CHARS = 64_000;

export const STUDIO_EPISODE_STATUSES = [
  "draft",
  "ready",
  "published",
  "archived",
] as const;

export type StudioEpisodeStatus = (typeof STUDIO_EPISODE_STATUSES)[number];

export function isStudioEpisodeStatus(
  value: string,
): value is StudioEpisodeStatus {
  return (STUDIO_EPISODE_STATUSES as readonly string[]).includes(value);
}
