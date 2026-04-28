-- Blog subscription state (user-level) for Lemon Squeezy recurring plans.
-- Phase 1 scope: blog premium access only (free/monthly/annual).

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'blog_subscription_tier'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.blog_subscription_tier as enum ('free', 'monthly', 'annual');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'blog_subscription_status'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.blog_subscription_status as enum ('active', 'cancelled', 'expired', 'past_due');
  end if;
end $$;

create table if not exists public.user_blog_subscriptions (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  subscription_tier public.blog_subscription_tier not null default 'free',
  subscription_status public.blog_subscription_status,
  lemon_squeezy_subscription_id text unique,
  lemon_squeezy_variant_id bigint,
  current_period_end timestamptz,
  manage_subscription_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_blog_subscription_webhook_events (
  event_id text primary key,
  lemon_squeezy_subscription_id text,
  event_name text not null,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz not null default now()
);

create index if not exists idx_user_blog_subscriptions_lemon_subscription_id
  on public.user_blog_subscriptions (lemon_squeezy_subscription_id);

create index if not exists idx_user_blog_subscriptions_tier_status
  on public.user_blog_subscriptions (subscription_tier, subscription_status);

alter table public.user_blog_subscriptions enable row level security;
alter table public.user_blog_subscription_webhook_events enable row level security;

drop policy if exists user_blog_subscriptions_select_own on public.user_blog_subscriptions;
create policy user_blog_subscriptions_select_own
  on public.user_blog_subscriptions
  for select
  to authenticated
  using (auth.uid() = user_id);

comment on table public.user_blog_subscriptions is
  'User-level blog subscription state for Lemon Squeezy monthly/annual plans.';

comment on table public.user_blog_subscription_webhook_events is
  'Idempotency ledger for Lemon Squeezy subscription webhooks.';
