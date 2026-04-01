-- AI pivot: premium content catalog + org entitlements (MVP)
-- Apply after 008. Regenerate types: pnpm db:types (requires Supabase project).

create table public.content_products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  price_cents bigint not null default 0,
  currency text not null default 'KRW',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.organization_content_entitlements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  content_product_id uuid not null references public.content_products(id) on delete cascade,
  granted_at timestamptz not null default now(),
  unique(organization_id, content_product_id)
);

create index idx_org_content_entitlements_org on public.organization_content_entitlements(organization_id);
create index idx_org_content_entitlements_product on public.organization_content_entitlements(content_product_id);

alter table public.content_products enable row level security;
alter table public.organization_content_entitlements enable row level security;

-- Public catalog: active rows visible to any role (including anon) for future storefront
create policy "Active content products are readable"
  on public.content_products for select
  using (is_active = true);

-- Org members see their entitlements
create policy "Org members can view org content entitlements"
  on public.organization_content_entitlements for select
  using (
    organization_id in (
      select organization_id from public.profiles where id = auth.uid()
    )
  );
