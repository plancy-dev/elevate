/**
 * Public documentation anchors for Studio providers (ADR-009 §8).
 *
 * This map is the SoT for "View official guide" links that appear on every
 * provider card, scene image gallery, Character Bible editor, and I2V CTA.
 * Keeping the URLs here (rather than scattered in UI strings) ensures that
 * vendor doc moves only require one edit.
 *
 * `apiDocsUrl` — canonical API / model documentation.
 * `pricingUrl` — current pricing page (optional; some vendors bundle into docs).
 * `tosUrl`     — terms / content policy (optional but recommended).
 */
import type { StudioIntegrationProviderId } from "@/lib/studio-integrations/types";

export type StudioProviderDocsEntry = {
  apiDocsUrl: string;
  pricingUrl?: string;
  tosUrl?: string;
};

export const STUDIO_PROVIDER_DOCS: Record<
  StudioIntegrationProviderId,
  StudioProviderDocsEntry
> = {
  openai: {
    apiDocsUrl: "https://platform.openai.com/docs/api-reference",
    pricingUrl: "https://openai.com/api/pricing/",
    tosUrl: "https://openai.com/policies/usage-policies/",
  },
  anthropic: {
    apiDocsUrl: "https://docs.anthropic.com/en/api/",
    pricingUrl: "https://www.anthropic.com/pricing",
    tosUrl: "https://www.anthropic.com/legal/aup",
  },
  runway: {
    apiDocsUrl: "https://docs.dev.runwayml.com/",
    pricingUrl: "https://docs.dev.runwayml.com/api-details/credits/",
    tosUrl: "https://runwayml.com/terms-of-use/",
  },
  youtube_data: {
    apiDocsUrl: "https://developers.google.com/youtube/v3",
    pricingUrl: "https://developers.google.com/youtube/v3/getting-started#quota",
    tosUrl: "https://developers.google.com/youtube/terms/api-services-terms-of-service",
  },
  google_gemini: {
    apiDocsUrl: "https://ai.google.dev/gemini-api/docs/image-generation",
    pricingUrl: "https://ai.google.dev/pricing",
    tosUrl: "https://ai.google.dev/gemini-api/terms",
  },
  elevenlabs: {
    apiDocsUrl: "https://elevenlabs.io/docs/api-reference",
    pricingUrl: "https://elevenlabs.io/pricing",
    tosUrl: "https://elevenlabs.io/terms-of-use",
  },
  flux_replicate: {
    apiDocsUrl: "https://replicate.com/black-forest-labs/flux-1.1-pro/api",
    pricingUrl: "https://replicate.com/pricing",
    tosUrl: "https://replicate.com/terms",
  },
  flux_fal: {
    apiDocsUrl: "https://fal.ai/models/fal-ai/flux-pro/api",
    pricingUrl: "https://fal.ai/pricing",
    tosUrl: "https://fal.ai/terms",
  },
  seedream: {
    apiDocsUrl: "https://docs.byteplus.com/en/docs/ModelArk/1099455",
    pricingUrl: "https://www.byteplus.com/en/pricing",
    tosUrl: "https://docs.byteplus.com/en/docs/byteplus-bp/Service-Terms-of-BytePlus",
  },
  buffer: {
    apiDocsUrl: "https://buffer.com/developers/api",
    pricingUrl: "https://buffer.com/pricing",
    tosUrl: "https://buffer.com/legal/terms",
  },
};

export function getProviderDocs(
  providerId: StudioIntegrationProviderId,
): StudioProviderDocsEntry {
  return STUDIO_PROVIDER_DOCS[providerId];
}
