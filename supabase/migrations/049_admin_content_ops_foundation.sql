-- Foundation schema for admin-managed newsletter/blog content operations.
-- Scope: subscriber lifecycle, content queue, source registry, run logs, publication logs.

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  email_normalized text generated always as (lower(trim(email))) stored,
  status text not null default 'subscribed' check (
    status in ('subscribed', 'unsubscribed', 'bounced', 'complained')
  ),
  consent_at timestamptz,
  unsubscribe_at timestamptz,
  locale text not null default 'en',
  frequency_pref text not null default 'weekly' check (
    frequency_pref in ('daily', 'weekly')
  ),
  source text not null default 'manual',
  source_ref text,
  tags text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (email_normalized)
);

create index if not exists idx_newsletter_subscribers_status
  on public.newsletter_subscribers (status);

create index if not exists idx_newsletter_subscribers_frequency
  on public.newsletter_subscribers (frequency_pref);

comment on table public.newsletter_subscribers is
  'Dedicated newsletter subscriber lifecycle table (separate from waitlist lead capture).';

create table if not exists public.content_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null check (kind in ('rss', 'blog', 'api', 'manual')),
  base_url text not null,
  rss_url text,
  is_active boolean not null default true,
  trust_weight int not null default 50 check (trust_weight between 0 and 100),
  topic_tags text[] not null default '{}',
  locale text,
  fetch_interval_minutes int not null default 1440,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_content_sources_active
  on public.content_sources (is_active, trust_weight desc);

comment on table public.content_sources is
  'Registry of curated news/blog sources for automated ingest and scoring.';

create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('blog', 'newsletter')),
  title text not null,
  slug text,
  locale text not null default 'en',
  summary text,
  body_markdown text not null default '',
  source_quality_score numeric(5, 2),
  fact_check_score numeric(5, 2),
  status text not null default 'draft' check (
    status in (
      'draft',
      'review_required',
      'approved',
      'rejected',
      'scheduled',
      'publishing',
      'published',
      'send_failed'
    )
  ),
  review_notes text,
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  approved_by uuid references public.profiles (id) on delete set null,
  approved_at timestamptz,
  scheduled_at timestamptz,
  published_at timestamptz,
  generation_model text,
  generation_prompt_version text,
  cta_variant text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_content_items_slug_locale
  on public.content_items (slug, locale)
  where slug is not null;

create index if not exists idx_content_items_status_updated_at
  on public.content_items (status, updated_at desc);

comment on table public.content_items is
  'Canonical content queue items for blog and newsletter lifecycle states.';

create table if not exists public.content_item_source_map (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references public.content_items (id) on delete cascade,
  source_id uuid not null references public.content_sources (id) on delete restrict,
  source_url text not null,
  source_title text,
  source_published_at timestamptz,
  snippet_hash text not null,
  excerpt text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (content_item_id, source_url)
);

create index if not exists idx_content_item_source_map_item
  on public.content_item_source_map (content_item_id);

create index if not exists idx_content_item_source_map_hash
  on public.content_item_source_map (snippet_hash);

comment on table public.content_item_source_map is
  'Attribution mapping from content queue items to source documents.';

create table if not exists public.content_runs (
  id uuid primary key default gen_random_uuid(),
  run_type text not null check (
    run_type in ('ingest', 'draft_generate', 'review_gate', 'publish')
  ),
  status text not null default 'queued' check (
    status in ('queued', 'running', 'succeeded', 'failed', 'cancelled')
  ),
  trigger_type text not null default 'manual' check (
    trigger_type in ('manual', 'scheduled', 'retry', 'api')
  ),
  started_at timestamptz,
  ended_at timestamptz,
  error_summary text,
  error_details jsonb,
  initiated_by uuid references public.profiles (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_content_runs_created_at
  on public.content_runs (created_at desc);

create index if not exists idx_content_runs_status
  on public.content_runs (status, run_type);

comment on table public.content_runs is
  'Operational run logs for ingestion, draft generation, review gate, and publish processes.';

create table if not exists public.content_publications (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references public.content_items (id) on delete cascade,
  channel text not null check (channel in ('blog', 'email')),
  status text not null default 'queued' check (
    status in ('queued', 'scheduled', 'processing', 'sent', 'published', 'failed', 'cancelled')
  ),
  provider text not null default 'internal',
  provider_message_id text,
  attempt_count int not null default 0,
  last_error text,
  scheduled_at timestamptz,
  processed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (content_item_id, channel, scheduled_at)
);

create index if not exists idx_content_publications_due
  on public.content_publications (status, scheduled_at);

create index if not exists idx_content_publications_item
  on public.content_publications (content_item_id, channel);

comment on table public.content_publications is
  'Channel-level publication and send tracking rows for each content item.';

-- Use service role/admin server actions only in MVP phase.
alter table public.newsletter_subscribers enable row level security;
alter table public.content_sources enable row level security;
alter table public.content_items enable row level security;
alter table public.content_item_source_map enable row level security;
alter table public.content_runs enable row level security;
alter table public.content_publications enable row level security;
