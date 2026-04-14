-- Studio v2: per-organization encrypted provider credentials (ADR-006).
-- Application encrypts plaintext before insert; DB stores ciphertext only.

create table public.studio_org_provider_connections (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  provider text not null,
  secret_ciphertext text not null,
  last_verified_at timestamptz null,
  created_by uuid null references public.profiles (id) on delete set null,
  updated_by uuid null references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint studio_org_provider_connections_provider_check check (
    provider in ('openai', 'runway', 'youtube_data', 'google_gemini')
  ),
  constraint studio_org_provider_connections_org_provider_unique unique (organization_id, provider)
);

comment on table public.studio_org_provider_connections is
  'Per-org encrypted provider credentials for Studio tool integrations (ADR-006).';

create index idx_studio_org_provider_connections_org
  on public.studio_org_provider_connections (organization_id, updated_at desc);

alter table public.studio_org_provider_connections enable row level security;

create policy "Org members can select studio_org_provider_connections"
  on public.studio_org_provider_connections
  for select
  using (
    organization_id = public.user_organization_id()
    and public.user_organization_id() is not null
  );

create policy "Org members can insert studio_org_provider_connections"
  on public.studio_org_provider_connections
  for insert
  with check (
    organization_id = public.user_organization_id()
    and public.user_organization_id() is not null
  );

create policy "Org members can update studio_org_provider_connections"
  on public.studio_org_provider_connections
  for update
  using (
    organization_id = public.user_organization_id()
    and public.user_organization_id() is not null
  );

create policy "Org members can delete studio_org_provider_connections"
  on public.studio_org_provider_connections
  for delete
  using (
    organization_id = public.user_organization_id()
    and public.user_organization_id() is not null
  );
