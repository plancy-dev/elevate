/**
 * Product analytics event names (snake_case values for PostHog).
 * Prefer a single callsite per event where possible.
 */
export const PostHogEvent = {
  ELEVATE_APP_READY: "elevate_app_ready",
  ELEVATE_DASHBOARD_IDENTIFIED: "elevate_dashboard_identified",
} as const;
