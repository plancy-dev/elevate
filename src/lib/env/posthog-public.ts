import { POSTHOG_PUBLIC_ENV } from "./posthog-public-constants";

/** Default US ingest; override with `NEXT_PUBLIC_POSTHOG_HOST` for EU, etc. */
const DEFAULT_POSTHOG_HOST = "https://us.i.posthog.com";

/** Client-safe PostHog config (`NEXT_PUBLIC_*` only). */
export function getPosthogPublicConfig(): {
  apiKey: string;
  apiHost: string;
} | null {
  const apiKey =
    process.env[POSTHOG_PUBLIC_ENV.PROJECT_TOKEN]?.trim() ?? "";
  if (!apiKey) return null;
  const apiHost =
    process.env[POSTHOG_PUBLIC_ENV.HOST]?.trim() || DEFAULT_POSTHOG_HOST;
  return { apiKey, apiHost };
}
