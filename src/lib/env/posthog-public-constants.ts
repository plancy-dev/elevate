/**
 * Public env names for PostHog browser SDK (`posthog-js`).
 *
 * Set `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` to the Project API key from PostHog → Project settings (`phc_…`).
 */
export const POSTHOG_PUBLIC_ENV = {
  HOST: "NEXT_PUBLIC_POSTHOG_HOST",
  /** Project API key (browser SDK). */
  PROJECT_TOKEN: "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN",
  /** Set to `1` or `true` for one-line browser console diagnostics (no secret values). */
  BROWSER_DEBUG: "NEXT_PUBLIC_POSTHOG_DEBUG",
} as const;
