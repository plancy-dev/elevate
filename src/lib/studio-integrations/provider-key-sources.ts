import type { StudioIntegrationProviderId } from "@/lib/studio-integrations/types";

/**
 * Official entry points to create or copy API keys. Opens in a new tab from the
 * Studio integrations UI. `billing` = usage/credits/quota (no public balance API for most keys).
 */
export const STUDIO_PROVIDER_KEY_SOURCES: Record<
  StudioIntegrationProviderId,
  { primary: string; secondary?: string; billing?: string }
> = {
  openai: {
    primary: "https://platform.openai.com/api-keys",
    billing: "https://platform.openai.com/settings/organization/billing",
  },
  anthropic: {
    primary: "https://console.anthropic.com/settings/keys",
    billing: "https://console.anthropic.com/settings/billing",
  },
  google_gemini: {
    primary: "https://aistudio.google.com/app/apikey",
    billing: "https://aistudio.google.com/app/billing",
  },
  runway: {
    primary: "https://dev.runwayml.com/",
    billing: "https://dev.runwayml.com/",
  },
  youtube_data: {
    /** Create API keys; pick a project first. */
    primary: "https://console.cloud.google.com/apis/credentials",
    /** Enable YouTube Data API v3 for the project before the key works. */
    secondary:
      "https://console.cloud.google.com/apis/library/youtube.googleapis.com",
    billing:
      "https://console.cloud.google.com/google/billing",
  },
};
