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
  "elevenlabs",
  "flux_replicate",
  "flux_fal",
  "seedream",
  "buffer",
] as const;

export type StudioIntegrationProviderId =
  (typeof STUDIO_INTEGRATION_PROVIDER_IDS)[number];

/**
 * Provider IDs usable for scene keyframe image generation.
 * Gemini is reused (one key serves LLM + images). See ADR-009.
 */
export const STUDIO_IMAGE_PROVIDER_IDS = [
  "google_gemini",
  "flux_replicate",
  "flux_fal",
  "seedream",
] as const;

export type StudioImageProviderId = (typeof STUDIO_IMAGE_PROVIDER_IDS)[number];

export function isStudioImageProviderId(
  v: unknown,
): v is StudioImageProviderId {
  return (
    typeof v === "string" &&
    (STUDIO_IMAGE_PROVIDER_IDS as readonly string[]).includes(v)
  );
}

/** Rollout phases for UI and server capability (PLAN-studio-provider-integrations). */
export type StudioIntegrationsRolloutPhase =
  | "v1_manual_only"
  | "v2_ui_shell"
  | "v2_credentials"
  | "v2_provider_calls";
