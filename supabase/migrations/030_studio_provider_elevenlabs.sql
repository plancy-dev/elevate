-- Add 'elevenlabs' to the provider CHECK constraint on studio_org_provider_connections.
-- This enables org-scoped ElevenLabs API key storage for TTS generation (Phase S1).

alter table public.studio_org_provider_connections
  drop constraint if exists studio_org_provider_connections_provider_check;

alter table public.studio_org_provider_connections
  add constraint studio_org_provider_connections_provider_check
  check (provider in ('openai', 'anthropic', 'runway', 'youtube_data', 'google_gemini', 'elevenlabs'));
