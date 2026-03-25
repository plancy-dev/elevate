-- Elevate: MICE Enterprise Event Platform - Initial Schema
-- Run in Supabase SQL Editor or via CLI migration

create extension if not exists "uuid-ossp";

-- Enums
create type user_role as enum ('admin', 'organizer', 'coordinator', 'viewer');
create type org_plan as enum ('starter', 'professional', 'enterprise');
create type event_type as enum (
  'conference', 'exhibition', 'meeting', 'incentive',
  'seminar', 'workshop', 'gala', 'other'
);
create type event_status as enum (
  'draft', 'planning', 'registration_open', 'live', 'completed', 'cancelled'
);
create type registration_type as enum ('general', 'vip', 'speaker', 'sponsor', 'media');

-- Organizations (multi-tenant)
create table public.organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  logo_url text,
  plan org_plan not null default 'starter',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Profiles (extends Supabase Auth)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  display_name text not null default '',
  avatar_url text,
  role user_role not null default 'viewer',
  organization_id uuid references public.organizations(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Venues
create table public.venues (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  address text not null default '',
  city text not null default '',
  country text not null default '',
  capacity integer not null default 0,
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now()
);

-- Events
create table public.events (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  slug text not null,
  description text not null default '',
  event_type event_type not null default 'conference',
  status event_status not null default 'draft',
  venue_id uuid references public.venues(id) on delete set null,
  start_date timestamptz not null,
  end_date timestamptz not null,
  timezone text not null default 'UTC',
  expected_attendees integer not null default 0,
  actual_attendees integer not null default 0,
  budget_cents bigint not null default 0,
  revenue_cents bigint not null default 0,
  currency text not null default 'USD',
  is_public boolean not null default false,
  cover_image_url text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(organization_id, slug)
);

-- Sessions (talks, workshops within an event)
create table public.sessions (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid not null references public.events(id) on delete cascade,
  title text not null,
  description text not null default '',
  speaker_name text not null default '',
  speaker_title text not null default '',
  room text not null default '',
  start_time timestamptz not null,
  end_time timestamptz not null,
  capacity integer not null default 0,
  registered_count integer not null default 0,
  created_at timestamptz not null default now()
);

-- Attendees
create table public.attendees (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid not null references public.events(id) on delete cascade,
  email text not null,
  first_name text not null default '',
  last_name text not null default '',
  company text not null default '',
  job_title text not null default '',
  registration_type registration_type not null default 'general',
  checked_in boolean not null default false,
  checked_in_at timestamptz,
  ticket_price_cents integer not null default 0,
  currency text not null default 'USD',
  nps_score smallint check (nps_score is null or (nps_score >= 0 and nps_score <= 10)),
  custom_fields jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique(event_id, email)
);

-- Session Attendance (many-to-many)
create table public.session_attendees (
  session_id uuid not null references public.sessions(id) on delete cascade,
  attendee_id uuid not null references public.attendees(id) on delete cascade,
  checked_in boolean not null default false,
  checked_in_at timestamptz,
  primary key (session_id, attendee_id)
);

-- Indexes
create index idx_profiles_org on public.profiles(organization_id);
create index idx_events_org on public.events(organization_id);
create index idx_events_status on public.events(status);
create index idx_events_dates on public.events(start_date, end_date);
create index idx_sessions_event on public.sessions(event_id);
create index idx_attendees_event on public.attendees(event_id);
create index idx_attendees_email on public.attendees(email);
create index idx_venues_org on public.venues(organization_id);

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-update timestamps
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_organizations_updated before update on public.organizations
  for each row execute procedure public.handle_updated_at();
create trigger on_profiles_updated before update on public.profiles
  for each row execute procedure public.handle_updated_at();
create trigger on_events_updated before update on public.events
  for each row execute procedure public.handle_updated_at();

-- Row Level Security
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.venues enable row level security;
alter table public.events enable row level security;
alter table public.sessions enable row level security;
alter table public.attendees enable row level security;
alter table public.session_attendees enable row level security;

-- Organization-scoped access: users see only their org's data
create policy "Users can view own organization"
  on public.organizations for select
  using (id in (select organization_id from public.profiles where id = auth.uid()));

-- Profiles
create policy "Users can view profiles in same org"
  on public.profiles for select
  using (organization_id in (select organization_id from public.profiles where id = auth.uid()));

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Venues
create policy "Org members can view venues"
  on public.venues for select
  using (organization_id in (select organization_id from public.profiles where id = auth.uid()));

create policy "Organizers can manage venues"
  on public.venues for all
  using (organization_id in (
    select organization_id from public.profiles
    where id = auth.uid() and role in ('admin', 'organizer')
  ));

-- Events
create policy "Org members can view events"
  on public.events for select
  using (organization_id in (select organization_id from public.profiles where id = auth.uid()));

create policy "Organizers can manage events"
  on public.events for all
  using (organization_id in (
    select organization_id from public.profiles
    where id = auth.uid() and role in ('admin', 'organizer', 'coordinator')
  ));

-- Sessions
create policy "Org members can view sessions"
  on public.sessions for select
  using (event_id in (
    select id from public.events where organization_id in (
      select organization_id from public.profiles where id = auth.uid()
    )
  ));

create policy "Organizers can manage sessions"
  on public.sessions for all
  using (event_id in (
    select id from public.events where organization_id in (
      select organization_id from public.profiles
      where id = auth.uid() and role in ('admin', 'organizer', 'coordinator')
    )
  ));

-- Attendees
create policy "Org members can view attendees"
  on public.attendees for select
  using (event_id in (
    select id from public.events where organization_id in (
      select organization_id from public.profiles where id = auth.uid()
    )
  ));

create policy "Organizers can manage attendees"
  on public.attendees for all
  using (event_id in (
    select id from public.events where organization_id in (
      select organization_id from public.profiles
      where id = auth.uid() and role in ('admin', 'organizer', 'coordinator')
    )
  ));

-- Session Attendees
create policy "Org members can view session attendees"
  on public.session_attendees for select
  using (session_id in (
    select s.id from public.sessions s
    join public.events e on e.id = s.event_id
    where e.organization_id in (
      select organization_id from public.profiles where id = auth.uid()
    )
  ));
