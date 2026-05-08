-- Remove legacy MICE domain: venues, events, sessions, attendees, junction table.
-- Apply to production only after backup; breaks any remaining event data permanently.

drop trigger if exists on_events_updated on public.events;

-- RLS policies (explicit drops for forward compatibility across migration history)
drop policy if exists "Organizers can manage session attendees" on public.session_attendees;
drop policy if exists "Org members can view session attendees" on public.session_attendees;
drop policy if exists "Organizers can manage attendees" on public.attendees;
drop policy if exists "Org members can view attendees" on public.attendees;
drop policy if exists "Organizers can manage sessions" on public.sessions;
drop policy if exists "Org members can view sessions" on public.sessions;
drop policy if exists "Organizers can manage events" on public.events;
drop policy if exists "Org members can view events" on public.events;
drop policy if exists "Organizers can manage venues" on public.venues;
drop policy if exists "Org members can view venues" on public.venues;

drop table if exists public.session_attendees cascade;
drop table if exists public.sessions cascade;
drop table if exists public.attendees cascade;
drop table if exists public.events cascade;
drop table if exists public.venues cascade;

drop type if exists public.registration_type;
drop type if exists public.event_status;
drop type if exists public.event_type;
