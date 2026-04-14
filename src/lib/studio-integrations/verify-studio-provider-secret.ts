import { verifyAnthropicApiKey } from "@/lib/studio-integrations/anthropic-verify";
import { verifyGoogleGeminiApiKey } from "@/lib/studio-integrations/gemini-verify";
import { verifyOpenAiApiKey } from "@/lib/studio-integrations/openai-verify";
import { verifyRunwayApiKey } from "@/lib/studio-integrations/runway-verify";
import type { StudioIntegrationProviderId } from "@/lib/studio-integrations/types";
import { verifyYoutubeDataApiKey } from "@/lib/studio-integrations/youtube-data-verify";

/**
 * Provider-specific reachability checks (no content generation). Used when
 * STUDIO_INTEGRATIONS_ENABLED and a ciphertext exists.
 */
export async function verifyStudioProviderSecret(
  provider: StudioIntegrationProviderId,
  secret: string,
): Promise<boolean> {
  const trimmed = secret.trim();
  switch (provider) {
    case "openai":
      return (await verifyOpenAiApiKey(trimmed)).ok;
    case "anthropic":
      return (await verifyAnthropicApiKey(trimmed)).ok;
    case "google_gemini":
      return (await verifyGoogleGeminiApiKey(trimmed)).ok;
    case "runway":
      return (await verifyRunwayApiKey(trimmed)).ok;
    case "youtube_data":
      return (await verifyYoutubeDataApiKey(trimmed)).ok;
    default:
      return false;
  }
}
