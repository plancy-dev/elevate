/**
 * Single source for next-intl `timeZone` (server request config + client provider).
 * Avoids ENVIRONMENT_FALLBACK / hydration noise from implicit local timezone differences.
 * @see https://next-intl.dev/docs/configuration#time-zone
 */
export const APP_TIME_ZONE =
  process.env.NEXT_PUBLIC_APP_TIME_ZONE?.trim() || "Asia/Seoul";
