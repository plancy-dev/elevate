-- Optional gate: only listed emails may start catalog checkout when enabled server-side
-- (see CATALOG_CHECKOUT_REQUIRE_ALLOWLIST). RLS: no anon/authenticated policies; service role + app server only.

create table if not exists public.catalog_purchase_allowlist (
  id uuid primary key default gen_random_uuid(),
  email_normalized text not null,
  created_at timestamptz not null default now(),
  note text,
  unique (email_normalized)
);

create index if not exists idx_catalog_purchase_allowlist_email
  on public.catalog_purchase_allowlist (email_normalized);

comment on table public.catalog_purchase_allowlist is
  'Normalized email allowlist for catalog Toss checkout when CATALOG_CHECKOUT_REQUIRE_ALLOWLIST=true.';

alter table public.catalog_purchase_allowlist enable row level security;
