import type { StudioIntegrationProviderId } from "@/lib/studio-integrations/types";

/**
 * Shared shape for server-only provider adapters (ADR-006).
 * Implementations live under `providers/<id>/` — no outbound calls unless STUDIO_INTEGRATIONS_ENABLED.
 */

export type ProviderAdapterHealthResult =
  | { ok: true }
  | { ok: false; status?: number };

export type ProviderRunStepNotImplemented = {
  ok: false;
  code: "not_implemented";
};

/** Thin adapter: verify credentials + future runStep (jobs, uploads, …). */
export type StudioProviderAdapter = {
  id: StudioIntegrationProviderId;
  healthCheck: (secret: string) => Promise<ProviderAdapterHealthResult>;
  /**
   * Optional automation step — stubs return `not_implemented` until Phase 2+.
   * @param _args reserved for episode context, artifact ids, idempotency keys
   */
  runStep?: (
    secret: string,
    _args: Record<string, unknown>,
  ) => Promise<ProviderRunStepNotImplemented | { ok: true }>;
};
