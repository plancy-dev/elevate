-- Studio Productions: org-scoped deliverables (episodes) and linked artifacts (prompts, URLs, labels).
-- v1: no vendor APIs; RLS matches any org member (see server actions + getOrgMemberContext).

create table public.studio_production_episodes (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  status text not null check (status in ('draft', 'ready', 'published', 'archived')),
  publish_url text null,
  distribution_label text not null default '',
  notes text not null default '',
  created_by uuid null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_studio_production_episodes_org_updated
  on public.studio_production_episodes (organization_id, updated_at desc);

create table public.studio_production_artifacts (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  episode_id uuid not null references public.studio_production_episodes(id) on delete cascade,
  artifact_role text not null,
  tool_platform text not null,
  content_text text not null default '',
  external_url text null,
  metadata jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index idx_studio_production_artifacts_episode_sort
  on public.studio_production_artifacts (episode_id, sort_order);

-- Denormalized organization_id on artifacts must match parent episode.
create or replace function public.studio_production_artifacts_sync_org()
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
    raise exception 'studio_production_artifacts: episode not found';
  end if;

  if NEW.organization_id is not null and NEW.organization_id is distinct from ep_org then
    raise exception 'studio_production_artifacts: organization_id does not match episode';
  end if;

  NEW.organization_id := ep_org;
  return NEW;
end;
$$;

create trigger trg_studio_production_artifacts_sync_org
  before insert or update on public.studio_production_artifacts
  for each row execute function public.studio_production_artifacts_sync_org();

-- Bump parent episode updated_at when artifacts change (list ordering).
create or replace function public.studio_production_episodes_touch_from_artifact()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    update public.studio_production_episodes
    set updated_at = now()
    where id = old.episode_id;
    return old;
  end if;
  update public.studio_production_episodes
  set updated_at = now()
  where id = new.episode_id;
  return new;
end;
$$;

create trigger trg_studio_production_artifacts_touch_episode
  after insert or update or delete on public.studio_production_artifacts
  for each row execute function public.studio_production_episodes_touch_from_artifact();

alter table public.studio_production_episodes enable row level security;
alter table public.studio_production_artifacts enable row level security;

create policy "Org members can select studio_production_episodes"
  on public.studio_production_episodes
  for select
  using (
    organization_id = public.user_organization_id()
    and public.user_organization_id() is not null
  );

create policy "Org members can insert studio_production_episodes"
  on public.studio_production_episodes
  for insert
  with check (
    organization_id = public.user_organization_id()
    and public.user_organization_id() is not null
  );

create policy "Org members can update studio_production_episodes"
  on public.studio_production_episodes
  for update
  using (
    organization_id = public.user_organization_id()
    and public.user_organization_id() is not null
  );

create policy "Org members can delete studio_production_episodes"
  on public.studio_production_episodes
  for delete
  using (
    organization_id = public.user_organization_id()
    and public.user_organization_id() is not null
  );

create policy "Org members can select studio_production_artifacts"
  on public.studio_production_artifacts
  for select
  using (
    organization_id = public.user_organization_id()
    and public.user_organization_id() is not null
  );

create policy "Org members can insert studio_production_artifacts"
  on public.studio_production_artifacts
  for insert
  with check (
    organization_id = public.user_organization_id()
    and public.user_organization_id() is not null
  );

create policy "Org members can update studio_production_artifacts"
  on public.studio_production_artifacts
  for update
  using (
    organization_id = public.user_organization_id()
    and public.user_organization_id() is not null
  );

create policy "Org members can delete studio_production_artifacts"
  on public.studio_production_artifacts
  for delete
  using (
    organization_id = public.user_organization_id()
    and public.user_organization_id() is not null
  );
