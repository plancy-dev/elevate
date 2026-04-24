/**
 * Scene image provider registry — single entry point for all image adapters.
 * ADR-009 §1-2.
 */
import "server-only";

import type {
  StudioImageProviderId,
} from "@/lib/studio-integrations/types";
import {
  type ImageGenParams,
  type ImageGenResult,
  type ImageProviderAdapter,
} from "@/lib/studio-integrations/providers/images/types";
import { geminiImageAdapter } from "@/lib/studio-integrations/providers/images/gemini/gemini-image";
import { fluxReplicateAdapter } from "@/lib/studio-integrations/providers/images/flux/flux-replicate";
import { fluxFalAdapter } from "@/lib/studio-integrations/providers/images/flux/flux-fal";
import { seedreamAdapter } from "@/lib/studio-integrations/providers/images/seedream/seedream";

const IMAGE_ADAPTERS: Record<StudioImageProviderId, ImageProviderAdapter> = {
  google_gemini: geminiImageAdapter,
  flux_replicate: fluxReplicateAdapter,
  flux_fal: fluxFalAdapter,
  seedream: seedreamAdapter,
};

export function getImageProviderAdapter(
  id: StudioImageProviderId,
): ImageProviderAdapter {
  return IMAGE_ADAPTERS[id];
}

export async function generateSceneImages(
  providerId: StudioImageProviderId,
  apiKey: string,
  params: ImageGenParams,
): Promise<ImageGenResult> {
  const adapter = getImageProviderAdapter(providerId);
  return adapter(apiKey, params);
}
