-- Pending invitations to join an organization (email + optional link token).

create table public.organization_invitations (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  role public.user_role not null default 'viewer',
  token text not null unique,
  invited_by uuid references public.profiles(id) on delete set null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_org_invitations_org on public.organization_invitations(organization_id);
create index idx_org_invitations_email_lower on public.organization_invitations(lower(email));

-- One pending invite per org + email
create unique index idx_org_invites_pending_unique
  on public.organization_invitations (organization_id, lower(email))
  where accepted_at is null;

alter table public.organization_invitations enable row level security;

-- Same-org admins and organizers manage invitations
create policy "Organizers can manage organization invitations"
  on public.organization_invitations
  for all
  using (
    organization_id = public.user_organization_id()
    and public.user_organization_id() is not null
    and public.user_role() in (
      'admin'::public.user_role,
      'organizer'::public.user_role
    )
  )
  with check (
    organization_id = public.user_organization_id()
    and public.user_organization_id() is not null
    and public.user_role() in (
      'admin'::public.user_role,
      'organizer'::public.user_role
    )
  );

-- Members can read invitations for their org (transparency)
create policy "Org members can view organization invitations"
  on public.organization_invitations
  for select
  using (
    organization_id = public.user_organization_id()
    and public.user_organization_id() is not null
  );
