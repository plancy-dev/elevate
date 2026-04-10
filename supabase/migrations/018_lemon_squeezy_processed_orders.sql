-- Lemon Squeezy webhook idempotency: one row per order `attributes.identifier` after a successful grant attempt.
-- Apply after 017. Regenerate types: pnpm db:types (requires Supabase project).

create table public.lemon_squeezy_processed_orders (
  ls_order_identifier text primary key,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  content_product_id uuid not null references public.content_products (id) on delete cascade,
  user_email text,
  variant_id bigint,
  event_name text not null default 'order_created',
  created_at timestamptz not null default now()
);

create index idx_lemon_squeezy_processed_orders_org
  on public.lemon_squeezy_processed_orders (organization_id);

comment on table public.lemon_squeezy_processed_orders is
  'Idempotency ledger for Lemon Squeezy webhooks (order identifier from payload attributes.identifier).';

alter table public.lemon_squeezy_processed_orders enable row level security;
