-- Extend studio_org_provider_connections.provider for Anthropic (Claude API).
-- @see docs/features/PLAN-studio-ai-content-os.md (P1)

alter table public.studio_org_provider_connections
  drop constraint studio_org_provider_connections_provider_check;

alter table public.studio_org_provider_connections
  add constraint studio_org_provider_connections_provider_check check (
    provider in (
      'openai',
      'anthropic',
      'runway',
      'youtube_data',
      'google_gemini'
    )
  );
