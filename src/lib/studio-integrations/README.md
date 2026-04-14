# `studio-integrations`

Server-side types and feature flags for **v2** provider connections (OpenAI, Anthropic Claude, Runway, YouTube Data API, Gemini, etc.).

- **ADR:** [`docs/adr/ADR-006-studio-provider-integrations-v2.md`](../../../docs/adr/ADR-006-studio-provider-integrations-v2.md)
- **Plan:** [`docs/features/PLAN-studio-provider-integrations.md`](../../../docs/features/PLAN-studio-provider-integrations.md)

v1 Productions (paste-only ledger) lives under `src/lib/studio-productions/` and is unchanged when integration flags are off.

**Adapters:** `providers/` — `runwayAdapter` + `getStudioProviderAdapter()` (Runway stub: health check + `runStep` → `not_implemented` until job submit is built).

**API vs app implementation (SoT):** [`docs/features/STUDIO_PROVIDER_API_CAPABILITY_MATRIX.md`](../../docs/features/STUDIO_PROVIDER_API_CAPABILITY_MATRIX.md)
