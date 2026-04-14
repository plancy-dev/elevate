-- Channel metadata (voice, modes) + LLM conversation thread per episode (audit / refine).

-- 1) Extend platform enum for channel-centric planning (YouTube longform, X).
alter table public.studio_distribution_channels
  drop constraint if exists studio_distribution_channels_platform_check;

alter table public.studio_distribution_channels
  add constraint studio_distribution_channels_platform_check check (
    platform in (
      'youtube_shorts',
      'youtube_long',
      'instagram_reels',
      'tiktok',
      'x',
      'other'
    )
  );

-- 2) Optional JSON profile: tone, audience_one_liner, content_modes[], etc.
alter table public.studio_distribution_channels
  add column if not exists metadata jsonb not null default '{}'::jsonb;

comment on column public.studio_distribution_channels.metadata is
  'Org-defined channel voice / modes; no secrets. Used when generating episode drafts.';

-- 3) One thread per episode for LLM turns (generate + refine).
create table public.studio_episode_llm_threads (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  episode_id uuid not null references public.studio_production_episodes (id) on delete cascade,
  provider text not null,
  model text not null default '',
  turns jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint studio_episode_llm_threads_episode_unique unique (episode_id)
);

create index idx_studio_episode_llm_threads_org
  on public.studio_episode_llm_threads (organization_id);

comment on table public.studio_episode_llm_threads is
  'Append-only style conversation log for episode draft generation/refine; turns JSON array.';

alter table public.studio_episode_llm_threads enable row level security;

create policy "Org members can select studio_episode_llm_threads"
  on public.studio_episode_llm_threads
  for select
  using (
    organization_id = public.user_organization_id()
    and public.user_organization_id() is not null
  );

create policy "Org members can insert studio_episode_llm_threads"
  on public.studio_episode_llm_threads
  for insert
  with check (
    organization_id = public.user_organization_id()
    and public.user_organization_id() is not null
  );

create policy "Org members can update studio_episode_llm_threads"
  on public.studio_episode_llm_threads
  for update
  using (
    organization_id = public.user_organization_id()
    and public.user_organization_id() is not null
  );

create policy "Org members can delete studio_episode_llm_threads"
  on public.studio_episode_llm_threads
  for delete
  using (
    organization_id = public.user_organization_id()
    and public.user_organization_id() is not null
  );
