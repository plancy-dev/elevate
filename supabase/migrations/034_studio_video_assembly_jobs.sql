-- Async FFmpeg video assembly jobs (Vercel enqueues; worker processes + uploads to Storage).

create table public.studio_video_assembly_jobs (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  episode_id uuid not null references public.studio_production_episodes(id) on delete cascade,
  status text not null check (status in ('pending', 'processing', 'completed', 'failed')),
  input jsonb not null default '{}'::jsonb,
  error_message text null,
  created_by uuid null references public.profiles(id) on delete set null,
  output_artifact_id uuid null references public.studio_production_artifacts(id) on delete set null,
  started_at timestamptz null,
  completed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_studio_video_assembly_jobs_episode_created
  on public.studio_video_assembly_jobs (episode_id, created_at desc);

create index idx_studio_video_assembly_jobs_pending
  on public.studio_video_assembly_jobs (created_at asc)
  where status = 'pending';

-- Denormalized organization_id must match parent episode.
create or replace function public.studio_video_assembly_jobs_sync_org()
returns trigger
language plpgsql
as $$
declare
  ep_org uuid;
begin
  select e.organization_id into ep_org
  from public.studio_production_episodes e
  where e.id = NEW.episode_id;

  if ep_org is null then
    raise exception 'studio_video_assembly_jobs: episode not found';
  end if;

  if NEW.organization_id is not null and NEW.organization_id is distinct from ep_org then
    raise exception 'studio_video_assembly_jobs: organization_id does not match episode';
  end if;

  NEW.organization_id := ep_org;
  return NEW;
end;
$$;

create trigger trg_studio_video_assembly_jobs_sync_org
  before insert or update on public.studio_video_assembly_jobs
  for each row execute function public.studio_video_assembly_jobs_sync_org();

create or replace function public.studio_video_assembly_jobs_touch_updated()
returns trigger
language plpgsql
as $$
begin
  NEW.updated_at := now();
  return NEW;
end;
$$;

create trigger trg_studio_video_assembly_jobs_touch_updated
  before update on public.studio_video_assembly_jobs
  for each row execute function public.studio_video_assembly_jobs_touch_updated();

alter table public.studio_video_assembly_jobs enable row level security;

create policy "Org members can select studio_video_assembly_jobs"
  on public.studio_video_assembly_jobs
  for select
  using (
    organization_id = public.user_organization_id()
    and public.user_organization_id() is not null
  );

create policy "Org members can insert studio_video_assembly_jobs"
  on public.studio_video_assembly_jobs
  for insert
  with check (
    organization_id = public.user_organization_id()
    and public.user_organization_id() is not null
  );

-- Worker (service_role) updates via bypass; no client UPDATE policy.

-- Atomically claim the next pending job (service_role only).
create or replace function public.claim_studio_video_assembly_job()
returns setof public.studio_video_assembly_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  rid uuid;
begin
  select j.id into rid
  from public.studio_video_assembly_jobs j
  where j.status = 'pending'
  order by j.created_at asc
  for update skip locked
  limit 1;

  if rid is null then
    return;
  end if;

  update public.studio_video_assembly_jobs
  set
    status = 'processing',
    started_at = now(),
    updated_at = now()
  where id = rid;

  return query
  select * from public.studio_video_assembly_jobs where id = rid;
end;
$$;

revoke all on function public.claim_studio_video_assembly_job() from public;
grant execute on function public.claim_studio_video_assembly_job() to service_role;

comment on table public.studio_video_assembly_jobs is
  'FFmpeg assembly queue: Next.js inserts pending rows; worker claims with claim_studio_video_assembly_job(), uploads MP4 to Storage, inserts assembled_video artifact.';
