-- Ebook delivery mode (PDF download vs web-only reader) + first-open audit for refund policy workflows.
-- Apply in Supabase SQL Editor or CLI, then: pnpm db:types

alter table public.content_products
  add column if not exists delivery_mode text not null default 'pdf';

alter table public.content_products
  drop constraint if exists content_products_delivery_mode_check;

alter table public.content_products
  add constraint content_products_delivery_mode_check
  check (delivery_mode in ('pdf', 'web_only'));

comment on column public.content_products.delivery_mode is
  'pdf: signed download allowed when entitled; web_only: in-app reader only, no file URL to end users.';

create table if not exists public.content_ebook_first_opens (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content_product_id uuid not null references public.content_products(id) on delete cascade,
  opened_at timestamptz not null default now(),
  unique (organization_id, user_id, content_product_id)
);

create index if not exists idx_ebook_first_opens_org on public.content_ebook_first_opens(organization_id);
create index if not exists idx_ebook_first_opens_product on public.content_ebook_first_opens(content_product_id);

alter table public.content_ebook_first_opens enable row level security;

drop policy if exists "Org members can insert own first-open rows" on public.content_ebook_first_opens;
create policy "Org members can insert own first-open rows"
  on public.content_ebook_first_opens for insert
  with check (
    organization_id in (select organization_id from public.profiles where id = auth.uid())
    and user_id = auth.uid()
  );

drop policy if exists "Org members can select own org first-opens" on public.content_ebook_first_opens;
create policy "Org members can select own org first-opens"
  on public.content_ebook_first_opens for select
  using (
    organization_id in (select organization_id from public.profiles where id = auth.uid())
  );
