-- Persist per-episode pipeline UI state (scene JSON, model picks, custom instructions, TTS options).

alter table public.studio_production_episodes
  add column if not exists pipeline_prefs jsonb not null default '{}'::jsonb;

comment on column public.studio_production_episodes.pipeline_prefs is
  'Client-managed pipeline UI state (scene plan JSON, LLM model ids, custom prompts, TTS prefs). Schema is application-defined; merged on save.';
