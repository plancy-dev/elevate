-- Extend studio_org_provider_connections.provider for Buffer (scheduled posts).
-- Phase 3: org-scoped Buffer API token for GraphQL publish endpoint.
-- Env fallback: BUFFER_API_KEY (server-only); per-org row overrides env when present.

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
      'seedream',
      'buffer'
    )
  );
