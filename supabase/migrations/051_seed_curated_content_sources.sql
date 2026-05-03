-- Replace smoke/sample ingest sources with curated production-relevant feeds.
-- Safe to run repeatedly.

begin;

-- 1) Disable smoke fixtures and known invalid sample endpoints.
update public.content_sources
set is_active = false,
    updated_at = now()
where name ilike '[SMOKE]%'
   or base_url ilike '%example.invalid%'
   or coalesce(rss_url, '') ilike '%example.invalid%';

-- 2) Curated source set for Elevate content ops.
with desired_sources as (
  select *
  from (
    values
      (
        'OpenAI News',
        'rss',
        'https://openai.com/news',
        'https://openai.com/news/rss.xml',
        true,
        90,
        array['ai-models','platform-updates','safety']::text[],
        'en',
        180
      ),
      (
        'Google AI Blog',
        'rss',
        'https://blog.google/technology/ai/',
        'https://blog.google/technology/ai/rss/',
        true,
        84,
        array['ai-research','product-updates','applied-ai']::text[],
        'en',
        240
      ),
      (
        'AWS Machine Learning Blog',
        'rss',
        'https://aws.amazon.com/blogs/machine-learning/',
        'https://aws.amazon.com/blogs/machine-learning/feed/',
        true,
        82,
        array['mlops','infrastructure','case-studies']::text[],
        'en',
        240
      ),
      (
        'Cloudflare Blog',
        'rss',
        'https://blog.cloudflare.com/',
        'https://blog.cloudflare.com/rss/',
        true,
        85,
        array['reliability','security','infra']::text[],
        'en',
        240
      ),
      (
        'GitHub Engineering Blog',
        'rss',
        'https://github.blog/',
        'https://github.blog/feed/',
        true,
        80,
        array['developer-platform','ai-coding','engineering']::text[],
        'en',
        360
      ),
      (
        'Supabase Blog',
        'rss',
        'https://supabase.com/blog',
        'https://supabase.com/blog/rss.xml',
        true,
        78,
        array['postgres','backend','developer-tools']::text[],
        'en',
        360
      )
  ) as t(
    name,
    kind,
    base_url,
    rss_url,
    is_active,
    trust_weight,
    topic_tags,
    locale,
    fetch_interval_minutes
  )
),
updated as (
  update public.content_sources as cs
  set name = ds.name,
      kind = ds.kind,
      rss_url = ds.rss_url,
      is_active = ds.is_active,
      trust_weight = ds.trust_weight,
      topic_tags = ds.topic_tags,
      locale = ds.locale,
      fetch_interval_minutes = ds.fetch_interval_minutes,
      updated_at = now()
  from desired_sources ds
  where lower(cs.base_url) = lower(ds.base_url)
  returning cs.base_url
)
insert into public.content_sources (
  name,
  kind,
  base_url,
  rss_url,
  is_active,
  trust_weight,
  topic_tags,
  locale,
  fetch_interval_minutes,
  metadata,
  updated_at
)
select
  ds.name,
  ds.kind,
  ds.base_url,
  ds.rss_url,
  ds.is_active,
  ds.trust_weight,
  ds.topic_tags,
  ds.locale,
  ds.fetch_interval_minutes,
  '{"seed":"curated_content_sources_v1"}'::jsonb,
  now()
from desired_sources ds
where not exists (
  select 1
  from public.content_sources cs
  where lower(cs.base_url) = lower(ds.base_url)
);

commit;
