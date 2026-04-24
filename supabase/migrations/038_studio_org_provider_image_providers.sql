-- Extend studio_org_provider_connections.provider for scene image generation providers.
-- Phase 1 image providers (ADR-009): FLUX via Replicate, FLUX via fal.ai, Seedream (BytePlus).
-- Gemini (google_gemini) already exists and is re-used for Imagen (one key per org for LLM + images).

alter table public.studio_org_provider_connections
  drop constraint if exists studio_org_provider_connections_provider_check;

alter table public.studio_org_provider_connections
  add constraint studio_org_provider_connections_provider_check
  check (
    provider in (
      'openai',
      'anthropic',
      'runway',
      'youtube_data',
      'google_gemini',
      'elevenlabs',
      'flux_replicate',
      'flux_fal',
      'seedream'
    )
  );
