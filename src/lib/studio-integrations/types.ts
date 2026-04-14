/**
 * Studio provider integrations (v2).
 * @see docs/adr/ADR-006-studio-provider-integrations-v2.md
 */

/** Logical providers we may wire behind server-only adapters. */
export const STUDIO_INTEGRATION_PROVIDER_IDS = [
  "openai",
  "anthropic",
  "runway",
  "youtube_data",
  "google_gemini",
] as const;

export type StudioIntegrationProviderId =
  (typeof STUDIO_INTEGRATION_PROVIDER_IDS)[number];

/** Rollout phases for UI and server capability (PLAN-studio-provider-integrations). */
export type StudioIntegrationsRolloutPhase =
  | "v1_manual_only"
  | "v2_ui_shell"
  | "v2_credentials"
  | "v2_provider_calls";
