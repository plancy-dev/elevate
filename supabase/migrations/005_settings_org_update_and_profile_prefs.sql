-- Settings: allow org name updates for admin/organizer; profile email digest preference.

alter table public.profiles
  add column if not exists email_milestone_digest boolean not null default true;

comment on column public.profiles.email_milestone_digest is
  'User preference: receive milestone digest emails (delivery wiring is product backlog).';

drop policy if exists "Org admins and organizers can update own organization"
  on public.organizations;

create policy "Org admins and organizers can update own organization"
  on public.organizations
  for update
  to authenticated
  using (
    id = public.user_organization_id()
    and public.user_organization_id() is not null
    and public.user_role() in (
      'admin'::public.user_role,
      'organizer'::public.user_role
    )
  )
  with check (
    id = public.user_organization_id()
    and public.user_organization_id() is not null
  );
