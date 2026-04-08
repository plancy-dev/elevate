-- Prompt Studio beta: optional email allowlist when STUDIO_BETA_REQUIRE_ALLOWLIST=true.
-- Managed from /admin/prompt-studio-allowlist (platform admin). RLS: no public policies.

create table if not exists public.prompt_studio_beta_allowlist (
  id uuid primary key default gen_random_uuid(),
  email_normalized text not null,
  created_at timestamptz not null default now(),
  note text,
  unique (email_normalized)
);

create index if not exists idx_prompt_studio_beta_allowlist_email
  on public.prompt_studio_beta_allowlist (email_normalized);

comment on table public.prompt_studio_beta_allowlist is
  'Normalized email allowlist for Prompt Studio beta when STUDIO_BETA_REQUIRE_ALLOWLIST=true.';

alter table public.prompt_studio_beta_allowlist enable row level security;
