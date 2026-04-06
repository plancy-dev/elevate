-- Singleton row for platform email options (waitlist BCC, etc.). Service role only via app.
create table if not exists public.platform_email_settings (
  id int primary key,
  constraint platform_email_settings_singleton check (id = 1),
  waitlist_bcc_email text,
  updated_at timestamptz not null default now()
);

insert into public.platform_email_settings (id, waitlist_bcc_email)
values (1, 'ray@plan-cy.com')
on conflict (id) do nothing;

alter table public.platform_email_settings enable row level security;
-- No policies: anon/authenticated cannot read; inserts/updates via service role in server code only.

comment on table public.platform_email_settings is
  'Singleton (id=1). waitlist_bcc_email: BCC on marketing waitlist confirmation emails.';
