-- Scheduled posts to social channels via Buffer (Phase 3).
-- Each row = one channel × one scheduled delivery for an episode's assembled video.
-- A single "publish" action from the UI creates N rows (one per selected channel),
-- each referencing the same buffer organization but a distinct channelId.

create table public.studio_scheduled_posts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  episode_id uuid not null references public.studio_production_episodes (id) on delete cascade,
  -- Social channel hint (what the UI showed the user). Buffer channelId is the
  -- actual routing identifier and lives in `buffer_channel_id`.
  platform text not null check (
    platform in (
      'instagram',
      'tiktok',
      'youtube',
      'youtube_shorts',
      'x',
      'threads',
      'linkedin',
      'facebook',
      'pinterest',
      'other'
    )
  ),
  buffer_channel_id text not null,
  buffer_post_id text null,
  caption text not null,
  video_url text not null,
  scheduled_at timestamptz not null,
  status text not null default 'pending' check (
    status in ('pending', 'scheduled', 'published', 'failed', 'cancelled')
  ),
  last_error text null,
  retry_count int not null default 0,
  idempotency_key text not null,
  created_by uuid null references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- One post per (org, episode, channel, scheduled slot). Prevents accidental
  -- double-schedule on rapid form submits.
  unique (organization_id, idempotency_key)
);

comment on table public.studio_scheduled_posts is
  'Buffer-managed scheduled posts per episode × channel. See ADR-009 follow-up (Phase 3).';

create index idx_studio_scheduled_posts_org_due
  on public.studio_scheduled_posts (organization_id, scheduled_at desc);

create index idx_studio_scheduled_posts_episode
  on public.studio_scheduled_posts (episode_id);

create index idx_studio_scheduled_posts_status
  on public.studio_scheduled_posts (status)
  where status in ('pending', 'failed');

alter table public.studio_scheduled_posts enable row level security;

create policy "Org members can select studio_scheduled_posts"
  on public.studio_scheduled_posts
  for select
  using (
    organization_id = public.user_organization_id()
    and public.user_organization_id() is not null
  );

create policy "Org members can insert studio_scheduled_posts"
  on public.studio_scheduled_posts
  for insert
  with check (
    organization_id = public.user_organization_id()
    and public.user_organization_id() is not null
  );

create policy "Org members can update studio_scheduled_posts"
  on public.studio_scheduled_posts
  for update
  using (
    organization_id = public.user_organization_id()
    and public.user_organization_id() is not null
  );

create policy "Org members can delete studio_scheduled_posts"
  on public.studio_scheduled_posts
  for delete
  using (
    organization_id = public.user_organization_id()
    and public.user_organization_id() is not null
  );
