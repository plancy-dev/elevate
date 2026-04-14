-- Snapshot row: draft immediately before an AI generate/refine replaced live artifacts (version history).

alter table public.studio_episode_draft_snapshots
  drop constraint if exists studio_episode_draft_snapshots_source_check;

alter table public.studio_episode_draft_snapshots
  add constraint studio_episode_draft_snapshots_source_check
  check (
    source in (
      'llm_generate',
      'llm_refine',
      'user_save',
      'restore',
      'superseded'
    )
  );

comment on column public.studio_episode_draft_snapshots.source is
  'superseded = draft text archived right before a new llm_generate/llm_refine wrote new live artifacts.';
