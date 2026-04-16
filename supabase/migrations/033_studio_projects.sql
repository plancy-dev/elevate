-- T1: Project(Brand/Channel) layer
-- Organization > Project > Episode hierarchy for multi-channel management.

create table public.studio_projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 200),
  slug text not null check (slug ~ '^[a-z0-9][a-z0-9_-]{0,62}$'),
  description text not null default '',
  brand_guide text not null default '',
  default_template_key text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (organization_id, slug)
);

create index idx_studio_projects_org
  on public.studio_projects (organization_id, updated_at desc);

comment on table public.studio_projects is
  'Brand/channel grouping layer. Each project scopes episodes, YouTube tokens, and AI persona (brand_guide).';

-- RLS
alter table public.studio_projects enable row level security;

create policy "Org members can select projects"
  on public.studio_projects for select
  using (
    organization_id = public.user_organization_id()
    and public.user_organization_id() is not null
  );

create policy "Org members can insert projects"
  on public.studio_projects for insert
  with check (
    organization_id = public.user_organization_id()
    and public.user_organization_id() is not null
  );

create policy "Org members can update projects"
  on public.studio_projects for update
  using (
    organization_id = public.user_organization_id()
    and public.user_organization_id() is not null
  );

create policy "Org members can delete projects"
  on public.studio_projects for delete
  using (
    organization_id = public.user_organization_id()
    and public.user_organization_id() is not null
  );

-- Add project_id FK to episodes (nullable for backward compat)
alter table public.studio_production_episodes
  add column project_id uuid null references public.studio_projects (id) on delete set null;

create index idx_studio_episodes_project
  on public.studio_production_episodes (project_id)
  where project_id is not null;

-- Move YouTube channel tokens scope: add project_id (nullable, org-level tokens remain valid)
alter table public.studio_youtube_channel_tokens
  add column project_id uuid null references public.studio_projects (id) on delete set null;

create index idx_studio_youtube_tokens_project
  on public.studio_youtube_channel_tokens (project_id)
  where project_id is not null;
