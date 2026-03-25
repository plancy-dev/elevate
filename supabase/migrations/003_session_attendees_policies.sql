-- RLS: session_attendees — organizers can link sessions ↔ attendees (001 had SELECT only)

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
        and e.organization_id in (
          select p.organization_id
          from public.profiles p
          where p.id = auth.uid()
            and p.role in ('admin', 'organizer', 'coordinator')
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
        and e.organization_id in (
          select p.organization_id
          from public.profiles p
          where p.id = auth.uid()
            and p.role in ('admin', 'organizer', 'coordinator')
        )
    )
  );
