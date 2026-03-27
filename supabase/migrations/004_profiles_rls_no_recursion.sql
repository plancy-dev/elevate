-- Fix: "infinite recursion detected in policy for relation profiles"
-- Policies on profiles (and others) must not subquery public.profiles under RLS.
-- SECURITY DEFINER helpers read profiles as the function owner (bypass RLS).

create or replace function public.user_organization_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select organization_id from public.profiles where id = auth.uid();
$$;

create or replace function public.user_role()
returns public.user_role
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

revoke all on function public.user_organization_id() from public;
revoke all on function public.user_role() from public;
grant execute on function public.user_organization_id() to authenticated;
grant execute on function public.user_role() to authenticated;

-- Organizations
drop policy if exists "Users can view own organization" on public.organizations;
create policy "Users can view own organization"
  on public.organizations for select
  using (id = user_organization_id() and user_organization_id() is not null);

-- Profiles (same-org view — no self-subquery on profiles)
drop policy if exists "Users can view profiles in same org" on public.profiles;
create policy "Users can view profiles in same org"
  on public.profiles for select
  using (
    user_organization_id() is not null
    and organization_id = user_organization_id()
  );

-- Venues
drop policy if exists "Org members can view venues" on public.venues;
drop policy if exists "Organizers can manage venues" on public.venues;

create policy "Org members can view venues"
  on public.venues for select
  using (organization_id = user_organization_id() and user_organization_id() is not null);

create policy "Organizers can manage venues"
  on public.venues for all
  using (
    organization_id = user_organization_id()
    and user_organization_id() is not null
    and user_role() in ('admin'::public.user_role, 'organizer'::public.user_role)
  );

-- Events
drop policy if exists "Org members can view events" on public.events;
drop policy if exists "Organizers can manage events" on public.events;

create policy "Org members can view events"
  on public.events for select
  using (organization_id = user_organization_id() and user_organization_id() is not null);

create policy "Organizers can manage events"
  on public.events for all
  using (
    organization_id = user_organization_id()
    and user_organization_id() is not null
    and user_role() in (
      'admin'::public.user_role,
      'organizer'::public.user_role,
      'coordinator'::public.user_role
    )
  );

-- Sessions
drop policy if exists "Org members can view sessions" on public.sessions;
drop policy if exists "Organizers can manage sessions" on public.sessions;

create policy "Org members can view sessions"
  on public.sessions for select
  using (
    event_id in (
      select e.id
      from public.events e
      where e.organization_id = user_organization_id()
        and user_organization_id() is not null
    )
  );

create policy "Organizers can manage sessions"
  on public.sessions for all
  using (
    event_id in (
      select e.id
      from public.events e
      where e.organization_id = user_organization_id()
        and user_organization_id() is not null
    )
    and user_role() in (
      'admin'::public.user_role,
      'organizer'::public.user_role,
      'coordinator'::public.user_role
    )
  );

-- Attendees
drop policy if exists "Org members can view attendees" on public.attendees;
drop policy if exists "Organizers can manage attendees" on public.attendees;

create policy "Org members can view attendees"
  on public.attendees for select
  using (
    event_id in (
      select e.id
      from public.events e
      where e.organization_id = user_organization_id()
        and user_organization_id() is not null
    )
  );

create policy "Organizers can manage attendees"
  on public.attendees for all
  using (
    event_id in (
      select e.id
      from public.events e
      where e.organization_id = user_organization_id()
        and user_organization_id() is not null
    )
    and user_role() in (
      'admin'::public.user_role,
      'organizer'::public.user_role,
      'coordinator'::public.user_role
    )
  );

-- Session attendees (001)
drop policy if exists "Org members can view session attendees" on public.session_attendees;

create policy "Org members can view session attendees"
  on public.session_attendees for select
  using (
    session_id in (
      select s.id
      from public.sessions s
      join public.events e on e.id = s.event_id
      where e.organization_id = user_organization_id()
        and user_organization_id() is not null
    )
  );

-- Session attendees (003) — replace profiles subquery
drop policy if exists "Organizers can manage session attendees" on public.session_attendees;

create policy "Organizers can manage session attendees"
  on public.session_attendees
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.sessions s
      inner join public.events e on e.id = s.event_id
      inner join public.attendees a on a.event_id = e.id and a.id = session_attendees.attendee_id
      where s.id = session_attendees.session_id
        and e.organization_id = user_organization_id()
        and user_organization_id() is not null
        and user_role() in (
          'admin'::public.user_role,
          'organizer'::public.user_role,
          'coordinator'::public.user_role
        )
    )
  )
  with check (
    exists (
      select 1
      from public.sessions s
      inner join public.events e on e.id = s.event_id
      inner join public.attendees a on a.event_id = e.id and a.id = session_attendees.attendee_id
      where s.id = session_attendees.session_id
        and e.organization_id = user_organization_id()
        and user_organization_id() is not null
        and user_role() in (
          'admin'::public.user_role,
          'organizer'::public.user_role,
          'coordinator'::public.user_role
        )
    )
  );
