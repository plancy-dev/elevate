# Schema Draft — AI Newsletter/Blog Content Ops

## Goal

Define a durable DB model for:

- subscriber lifecycle
- source ingestion and traceability
- content queue and review workflow
- publication scheduling and send/result tracking
- operational run logs

This is a draft for implementation planning, not an applied migration.

## 1) `newsletter_subscribers`

Purpose: dedicated newsletter opt-in domain (separate from waitlist lead capture).

```sql
create table newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  email_normalized text generated always as (lower(trim(email))) stored,
  status text not null default 'subscribed'
    check (status in ('subscribed','unsubscribed','bounced','complained')),
  consent_at timestamptz,
  unsubscribe_at timestamptz,
  locale text not null default 'en',
  frequency_pref text not null default 'weekly'
    check (frequency_pref in ('daily','weekly')),
  source text not null default 'manual',
  source_ref text,
  tags text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (email_normalized)
);
```

## 2) `content_sources`

Purpose: source registry for news/blog ingestion.

```sql
create table content_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null check (kind in ('rss','blog','api','manual')),
  base_url text not null,
  rss_url text,
  is_active boolean not null default true,
  trust_weight int not null default 50 check (trust_weight between 0 and 100),
  topic_tags text[] not null default '{}',
  locale text,
  fetch_interval_minutes int not null default 1440,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
```

## 3) `content_items`

Purpose: canonical queue unit for both blog/newsletter drafts.

```sql
create table content_items (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('blog','newsletter')),
  title text not null,
  slug text,
  locale text not null default 'en',
  summary text,
  body_markdown text not null default '',
  source_quality_score numeric(5,2),
  fact_check_score numeric(5,2),
  status text not null default 'draft'
    check (status in (
      'draft',
      'review_required',
      'approved',
      'rejected',
      'scheduled',
      'publishing',
      'published',
      'send_failed'
    )),
  review_notes text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  scheduled_at timestamptz,
  published_at timestamptz,
  generation_model text,
  generation_prompt_version text,
  cta_variant text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index content_items_unique_slug_per_locale
  on content_items (slug, locale)
  where slug is not null;
```

## 4) `content_item_source_map`

Purpose: attribution + dedupe traceability.

```sql
create table content_item_source_map (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references content_items(id) on delete cascade,
  source_id uuid not null references content_sources(id) on delete restrict,
  source_url text not null,
  source_title text,
  source_published_at timestamptz,
  snippet_hash text not null,
  excerpt text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  unique (content_item_id, source_url),
  unique (snippet_hash)
);
```

## 5) `content_runs`

Purpose: pipeline run observability and restart coordination.

```sql
create table content_runs (
  id uuid primary key default gen_random_uuid(),
  run_type text not null
    check (run_type in ('ingest','draft_generate','review_gate','publish')),
  status text not null default 'queued'
    check (status in ('queued','running','succeeded','failed','cancelled')),
  trigger_type text not null default 'manual'
    check (trigger_type in ('manual','scheduled','retry','api')),
  started_at timestamptz,
  ended_at timestamptz,
  error_summary text,
  error_details jsonb,
  initiated_by uuid references auth.users(id),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);
```

## 6) `content_publications`

Purpose: channel-level publish/send state tracking per content item.

```sql
create table content_publications (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references content_items(id) on delete cascade,
  channel text not null check (channel in ('blog','email')),
  status text not null default 'queued'
    check (status in ('queued','scheduled','processing','sent','published','failed','cancelled')),
  provider text not null default 'internal',
  provider_message_id text,
  attempt_count int not null default 0,
  last_error text,
  scheduled_at timestamptz,
  processed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (content_item_id, channel, scheduled_at)
);
```

## RLS Draft Policy Direction

- Admin-only write for `content_items`, `content_sources`, `content_runs`, `content_publications`.
- Service-role bypass allowed for ingestion/generation workers.
- `newsletter_subscribers`:
  - admin can read/write.
  - public API route only allows unsubscribe token-based status changes.
- Future org scoping can be added by introducing `organization_id` across all tables if content ops becomes tenant-specific.

## Migration Strategy from Existing Data

1. Keep `waitlist_signups` as lead capture source of truth.
2. Backfill `newsletter_subscribers` from opt-in-eligible records.
3. Keep file-based blog automation in parallel while `content_items` publish path stabilizes.
4. Once stable, make DB queue primary and reduce Git-based autopublish responsibilities.

## Open Decisions for PLAN

- `content_items.slug` requirement for newsletter type (nullable vs generated)
- whether `snippet_hash` uniqueness should be global or scoped by source
- exact unsubscribe token table design (new table vs signed token approach)
- whether to add `content_templates` table in MVP or phase 2
