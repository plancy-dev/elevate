import { POSTHOG_PUBLIC_ENV } from "./posthog-public-constants";

/** Client-safe PostHog config (NEXT_PUBLIC_* only). */
export function getPosthogPublicConfig(): {
  apiKey: string;
  apiHost: string;
} | null {
  const fromKey = process.env[POSTHOG_PUBLIC_ENV.KEY]?.trim();
  const fromWizard = process.env[POSTHOG_PUBLIC_ENV.PROJECT_TOKEN]?.trim();
  const apiKey = fromKey || fromWizard;
  if (!apiKey) return null;
  const apiHost =
    process.env[POSTHOG_PUBLIC_ENV.HOST]?.trim() || "https://us.i.posthog.com";
  return { apiKey, apiHost };
}
