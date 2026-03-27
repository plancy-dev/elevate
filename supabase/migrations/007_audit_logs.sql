-- Append-only audit trail for org-scoped actions (inserts via service role only).

create table public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null default '',
  entity_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index idx_audit_logs_org_created on public.audit_logs(organization_id, created_at desc);

alter table public.audit_logs enable row level security;

create policy "Org members can view audit logs"
  on public.audit_logs
  for select
  using (
    organization_id = public.user_organization_id()
    and public.user_organization_id() is not null
  );

-- Inserts: service role only (no policy for authenticated users)
