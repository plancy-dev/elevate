import type { StudioIntegrationProviderId } from "@/lib/studio-integrations/types";
import { elevenlabsAdapter } from "@/lib/studio-integrations/providers/elevenlabs";
import { runwayAdapter } from "@/lib/studio-integrations/providers/runway";
import type { StudioProviderAdapter } from "@/lib/studio-integrations/providers/types";

const registry: Partial<
  Record<StudioIntegrationProviderId, StudioProviderAdapter>
> = {
  runway: runwayAdapter,
  elevenlabs: elevenlabsAdapter,
};

/** Returns a wired adapter when Phase 2+ implements it; otherwise undefined. */
export function getStudioProviderAdapter(
  id: StudioIntegrationProviderId,
): StudioProviderAdapter | undefined {
  return registry[id];
}
