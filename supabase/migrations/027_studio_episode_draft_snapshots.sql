-- Immutable version history for hook / title / script_draft per episode (LLM + manual saves + restore).

create table public.studio_episode_draft_snapshots (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  episode_id uuid not null references public.studio_production_episodes (id) on delete cascade,
  source text not null check (
    source in ('llm_generate', 'llm_refine', 'user_save', 'restore')
  ),
  hook text not null default '',
  title text not null default '',
  script_draft text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_studio_episode_draft_snapshots_episode_created
  on public.studio_episode_draft_snapshots (episode_id, created_at desc);

comment on table public.studio_episode_draft_snapshots is
  'Append-only snapshots of the three draft fields for version history; current live text remains in studio_production_artifacts.';

-- organization_id must match parent episode (same pattern as studio_production_artifacts).
create or replace function public.studio_episode_draft_snapshots_sync_org()
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
    raise exception 'studio_episode_draft_snapshots: episode not found';
  end if;

  if NEW.organization_id is not null and NEW.organization_id is distinct from ep_org then
    raise exception 'studio_episode_draft_snapshots: organization_id does not match episode';
  end if;

  NEW.organization_id := ep_org;
  return NEW;
end;
$$;

create trigger trg_studio_episode_draft_snapshots_sync_org
  before insert on public.studio_episode_draft_snapshots
  for each row execute function public.studio_episode_draft_snapshots_sync_org();

alter table public.studio_episode_draft_snapshots enable row level security;

create policy "Org members can select studio_episode_draft_snapshots"
  on public.studio_episode_draft_snapshots
  for select
  using (
    organization_id = public.user_organization_id()
    and public.user_organization_id() is not null
  );

create policy "Org members can insert studio_episode_draft_snapshots"
  on public.studio_episode_draft_snapshots
  for insert
  with check (
    organization_id = public.user_organization_id()
    and public.user_organization_id() is not null
  );
