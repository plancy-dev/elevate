-- Explicit dashboard allowlist on profiles (`canUseDashboard` always checks this
-- with the service role; set true for operators who may open /dashboard).

alter table public.profiles
  add column if not exists dashboard_access boolean not null default false;

comment on column public.profiles.dashboard_access is
  'When true, user may open /dashboard (server checks via service role). Distinct from profiles.role (org-scoped).';
