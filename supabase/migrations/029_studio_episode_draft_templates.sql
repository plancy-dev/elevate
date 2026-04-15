-- Org-scoped custom episode draft prompt templates (style/bias text for LLM user prompt).

create table public.studio_episode_draft_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0 and char_length(name) <= 200),
  bias_body text not null check (char_length(bias_body) <= 12000),
  created_by uuid null references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_studio_episode_draft_templates_org_name
  on public.studio_episode_draft_templates (organization_id, name);

comment on table public.studio_episode_draft_templates is
  'Custom draft style templates: bias_body is injected into buildDraftPrompt (org members CRUD).';

alter table public.studio_episode_draft_templates enable row level security;

create policy "Org members can select studio_episode_draft_templates"
  on public.studio_episode_draft_templates
  for select
  using (
    organization_id = public.user_organization_id()
    and public.user_organization_id() is not null
  );

create policy "Org members can insert studio_episode_draft_templates"
  on public.studio_episode_draft_templates
  for insert
  with check (
    organization_id = public.user_organization_id()
    and public.user_organization_id() is not null
  );

create policy "Org members can update studio_episode_draft_templates"
  on public.studio_episode_draft_templates
  for update
  using (
    organization_id = public.user_organization_id()
    and public.user_organization_id() is not null
  );

create policy "Org members can delete studio_episode_draft_templates"
  on public.studio_episode_draft_templates
  for delete
  using (
    organization_id = public.user_organization_id()
    and public.user_organization_id() is not null
  );
