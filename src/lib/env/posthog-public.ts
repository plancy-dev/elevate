/** Client-safe PostHog config (NEXT_PUBLIC_* only). */
export function getPosthogPublicConfig(): {
  apiKey: string;
  apiHost: string;
} | null {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
  if (!apiKey) return null;
  const apiHost =
    process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() ||
    "https://us.i.posthog.com";
  return { apiKey, apiHost };
}
