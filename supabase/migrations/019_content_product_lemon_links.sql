-- Lemon Squeezy variant linkage for operator-managed checkout (service role only).
-- Do not store on public.content_products: anon RLS can read active catalog rows for marketing.

create table public.content_product_lemon_links (
  content_product_id uuid primary key references public.content_products (id) on delete cascade,
  lemon_variant_id text not null,
  lemon_product_id text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint content_product_lemon_links_variant_id_nonempty check (char_length(trim(lemon_variant_id)) > 0)
);

comment on table public.content_product_lemon_links is
  'Maps Elevate catalog rows to Lemon variant IDs. Readable/writable only via service role (admin API); not exposed to anon catalog reads.';

alter table public.content_product_lemon_links enable row level security;

-- No policies: JWT roles cannot access; service_role bypasses RLS for server actions and billing resolution.
