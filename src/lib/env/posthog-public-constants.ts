/**
 * Public env names for PostHog browser SDK (see PostHog Next.js install wizard).
 * Prefer PROJECT_TOKEN when following dashboard copy; KEY is legacy alias.
 */
export const POSTHOG_PUBLIC_ENV = {
  HOST: "NEXT_PUBLIC_POSTHOG_HOST",
  /** Legacy single name */
  KEY: "NEXT_PUBLIC_POSTHOG_KEY",
  /** Name used by `npx @posthog/wizard` / project setup UI */
  PROJECT_TOKEN: "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN",
} as const;
