/**
 * Common shape for scene keyframe image generation adapters (ADR-009).
 *
 * All adapters are server-only (never import in client code); callers must
 * provide an already-decrypted API key via getOrgLlmCredentialForProvider or
 * the equivalent secret-fetching path.
 */
import "server-only";

import type { StudioImageProviderId } from "@/lib/studio-integrations/types";

export type ImageAspectRatio = "9:16" | "16:9" | "1:1";

export type ImageGenParams = {
  /**
   * Fully-prepared prompt (IDENTITY LOCK block already prefixed by the
   * scene-image-prompt builder). Providers receive it as-is.
   */
  prompt: string;
  /** Number of candidates to generate. Adapters may clamp to vendor limits. */
  count: number;
  aspectRatio: ImageAspectRatio;
  /**
   * Optional Master Reference Image URL (HTTPS). Adapters pass it to the
   * vendor's subject/reference slot when available.
   */
  referenceImageUrl?: string;
  /** Deterministic seed (when vendor supports it). */
  seed?: number;
};

export type GeneratedImage = {
  bytes: Buffer;
  mimeType: string;
  width: number;
  height: number;
  seed?: number;
  /**
   * Whether the vendor response indicates the image is watermark-free (either
   * because watermarking was disabled or because the tier/model never marks).
   * Adapters set this conservatively; the server action blocks promoting
   * watermarked images to `scene_keyframe_first|last`.
   */
  watermarkFree: boolean;
};

export type ImageGenErrorCode =
  | "image_provider_missing_key"
  | "image_provider_empty_prompt"
  | "image_provider_api_error"
  | "image_provider_watermark_detected"
  | "image_provider_safety_blocked"
  | "image_provider_timeout"
  | "image_provider_rate_limited";

export type ImageGenResult =
  | { ok: true; model: string; images: GeneratedImage[] }
  | { ok: false; code: ImageGenErrorCode; message?: string; status?: number };

/**
 * Adapter function signature. Every image provider exports one function of
 * this shape and registers itself in `providers/images/registry.ts`.
 */
export type ImageProviderAdapter = (
  apiKey: string,
  params: ImageGenParams,
) => Promise<ImageGenResult>;

/** Declarative metadata used by UI surfaces to render provider choices. */
export type ImageProviderMeta = {
  id: StudioImageProviderId;
  /** Default model identifier sent to the vendor (human-readable fallback). */
  defaultModel: string;
  /** Maximum count per API call (adapters must still clamp). */
  maxCount: number;
  /** Whether the adapter accepts a reference image in this phase. */
  supportsReference: boolean;
};

export const IMAGE_PROVIDER_META: Record<
  StudioImageProviderId,
  ImageProviderMeta
> = {
  google_gemini: {
    id: "google_gemini",
    defaultModel: "gemini-3.1-flash-image-preview",
    maxCount: 4,
    supportsReference: true,
  },
  flux_replicate: {
    id: "flux_replicate",
    defaultModel: "black-forest-labs/flux-1.1-pro",
    maxCount: 4,
    supportsReference: true,
  },
  flux_fal: {
    id: "flux_fal",
    defaultModel: "fal-ai/flux-pro",
    maxCount: 4,
    supportsReference: true,
  },
  seedream: {
    id: "seedream",
    defaultModel: "seedream-3.0",
    maxCount: 4,
    supportsReference: true,
  },
};
