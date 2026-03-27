-- Toss Payments PoC: pending/confirmed payment rows (inserts via service role from Next.js only).

create table public.toss_payment_intents (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete restrict,
  order_id text not null unique,
  amount_krw integer not null check (amount_krw > 0),
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'failed', 'expired')),
  payment_key text,
  confirmed_at timestamptz,
  last_webhook_at timestamptz,
  last_webhook_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_toss_payment_intents_org_created
  on public.toss_payment_intents(organization_id, created_at desc);

alter table public.toss_payment_intents enable row level security;

create policy "Org members can view own toss payment intents"
  on public.toss_payment_intents
  for select
  using (
    organization_id = public.user_organization_id()
    and public.user_organization_id() is not null
  );

-- Inserts/updates: application service role only (no policy for authenticated users)
