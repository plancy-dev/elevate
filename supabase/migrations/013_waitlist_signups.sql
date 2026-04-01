-- Newsletter / early-access emails. Inserts only via server API (service role).
-- Export from Supabase Table Editor or SQL for spreadsheet workflows.

create table public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  locale text,
  source text not null default 'home',
  created_at timestamptz not null default now()
);

create unique index waitlist_signups_email_lower_idx
  on public.waitlist_signups (lower(trim(email)));

alter table public.waitlist_signups enable row level security;
-- Intentionally no SELECT/INSERT policies for anon/authenticated: service role bypasses RLS.
