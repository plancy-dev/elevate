-- Phase 2: migrate blog subscription storage from provider-specific
-- `lemon_squeezy_*` columns to provider-agnostic `payment_*` columns.
--
-- This migration is intentionally non-breaking:
-- - keeps legacy columns
-- - backfills new columns
-- - adds sync trigger so old/new writes stay aligned during rollout

alter table public.user_blog_subscriptions
  add column if not exists payment_provider text,
  add column if not exists payment_subscription_id text,
  add column if not exists payment_product_id text;

alter table public.user_blog_subscription_webhook_events
  add column if not exists payment_provider text,
  add column if not exists payment_subscription_id text;

-- Allowed providers for current rollout.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_blog_subscriptions_payment_provider_check'
  ) then
    alter table public.user_blog_subscriptions
      add constraint user_blog_subscriptions_payment_provider_check
      check (
        payment_provider is null
        or payment_provider in ('lemonsqueezy', 'polar')
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_blog_subscription_webhook_events_payment_provider_check'
  ) then
    alter table public.user_blog_subscription_webhook_events
      add constraint user_blog_subscription_webhook_events_payment_provider_check
      check (
        payment_provider is null
        or payment_provider in ('lemonsqueezy', 'polar')
      );
  end if;
end $$;

-- Backfill from legacy Lemon columns.
update public.user_blog_subscriptions
set
  payment_provider = coalesce(payment_provider, 'lemonsqueezy'),
  payment_subscription_id = coalesce(payment_subscription_id, lemon_squeezy_subscription_id),
  payment_product_id = coalesce(payment_product_id, lemon_squeezy_variant_id::text)
where
  lemon_squeezy_subscription_id is not null
  or lemon_squeezy_variant_id is not null;

update public.user_blog_subscription_webhook_events
set
  payment_provider = coalesce(payment_provider, 'lemonsqueezy'),
  payment_subscription_id = coalesce(payment_subscription_id, lemon_squeezy_subscription_id)
where lemon_squeezy_subscription_id is not null;

-- Provider-agnostic lookup/uniqueness for future use.
create unique index if not exists idx_user_blog_subscriptions_payment_provider_subscription_id
  on public.user_blog_subscriptions (payment_provider, payment_subscription_id)
  where payment_provider is not null and payment_subscription_id is not null;

create index if not exists idx_user_blog_subscriptions_payment_product_id
  on public.user_blog_subscriptions (payment_product_id);

create index if not exists idx_user_blog_subscription_webhook_events_payment_subscription
  on public.user_blog_subscription_webhook_events (payment_provider, payment_subscription_id);

-- Transitional sync function to keep legacy/new columns aligned.
create or replace function public.sync_user_blog_subscriptions_payment_columns()
returns trigger
language plpgsql
as $$
begin
  -- legacy -> new
  if new.payment_subscription_id is null and new.lemon_squeezy_subscription_id is not null then
    new.payment_subscription_id := new.lemon_squeezy_subscription_id;
  end if;

  if new.payment_product_id is null and new.lemon_squeezy_variant_id is not null then
    new.payment_product_id := new.lemon_squeezy_variant_id::text;
  end if;

  if new.payment_provider is null and (
    new.lemon_squeezy_subscription_id is not null
    or new.lemon_squeezy_variant_id is not null
  ) then
    new.payment_provider := 'lemonsqueezy';
  end if;

  -- new -> legacy (only when provider is Lemon and value is numeric)
  if new.lemon_squeezy_subscription_id is null
     and new.payment_provider = 'lemonsqueezy'
     and new.payment_subscription_id is not null then
    new.lemon_squeezy_subscription_id := new.payment_subscription_id;
  end if;

  if new.lemon_squeezy_variant_id is null
     and new.payment_provider = 'lemonsqueezy'
     and new.payment_product_id ~ '^[0-9]+$' then
    new.lemon_squeezy_variant_id := new.payment_product_id::bigint;
  end if;

  return new;
end
$$;

drop trigger if exists trg_sync_user_blog_subscriptions_payment_columns
  on public.user_blog_subscriptions;

create trigger trg_sync_user_blog_subscriptions_payment_columns
before insert or update on public.user_blog_subscriptions
for each row
execute function public.sync_user_blog_subscriptions_payment_columns();

comment on column public.user_blog_subscriptions.payment_provider is
  'Payment provider identifier (e.g. lemonsqueezy, polar).';

comment on column public.user_blog_subscriptions.payment_subscription_id is
  'Provider-native subscription identifier (provider-agnostic replacement of lemon_squeezy_subscription_id).';

comment on column public.user_blog_subscriptions.payment_product_id is
  'Provider-native product/plan identifier (provider-agnostic replacement of lemon_squeezy_variant_id).';

comment on column public.user_blog_subscription_webhook_events.payment_provider is
  'Payment provider for this webhook event.';

comment on column public.user_blog_subscription_webhook_events.payment_subscription_id is
  'Provider-native subscription id captured for webhook idempotency and auditing.';
