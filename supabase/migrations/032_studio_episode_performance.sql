-- Episode performance tracking from YouTube Analytics (Phase S5).
-- Stores periodic snapshots of video metrics for A/B prompt analysis.

create table public.studio_episode_performance (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  episode_id uuid not null references public.studio_production_episodes (id) on delete cascade,
  youtube_video_id text null,
  snapshot_date date not null default current_date,

  views bigint not null default 0,
  watch_time_minutes numeric(12,2) not null default 0,
  average_view_duration_seconds numeric(8,2) null,
  likes bigint not null default 0,
  comments bigint not null default 0,
  shares bigint not null default 0,
  impressions bigint not null default 0,
  click_through_rate numeric(5,4) null,
  average_view_percentage numeric(5,2) null,
  estimated_revenue_usd numeric(10,4) null,
  subscriber_change integer not null default 0,

  metadata jsonb null default '{}',
  fetched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),

  unique (episode_id, snapshot_date)
);

create index idx_studio_episode_performance_org
  on public.studio_episode_performance (organization_id);

create index idx_studio_episode_performance_episode_date
  on public.studio_episode_performance (episode_id, snapshot_date desc);

comment on table public.studio_episode_performance is
  'Daily snapshots of YouTube video metrics per episode. Used for A/B prompt analysis and ROI tracking.';

alter table public.studio_episode_performance enable row level security;

create policy "Org members can select episode performance"
  on public.studio_episode_performance
  for select
  using (
    organization_id = public.user_organization_id()
    and public.user_organization_id() is not null
  );

create policy "Org members can insert episode performance"
  on public.studio_episode_performance
  for insert
  with check (
    organization_id = public.user_organization_id()
    and public.user_organization_id() is not null
  );

create policy "Org members can update episode performance"
  on public.studio_episode_performance
  for update
  using (
    organization_id = public.user_organization_id()
    and public.user_organization_id() is not null
  );
