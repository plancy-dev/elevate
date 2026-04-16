/**
 * Server-only provider adapters (v2). Wire from actions/jobs when STUDIO_INTEGRATIONS_ENABLED.
 */
export { elevenlabsAdapter } from "./elevenlabs";
export { runwayAdapter } from "./runway";
export { getStudioProviderAdapter } from "./registry";
export type {
  ProviderAdapterHealthResult,
  ProviderRunStepNotImplemented,
  ProviderRunStepResult,
  StudioProviderAdapter,
} from "./types";
