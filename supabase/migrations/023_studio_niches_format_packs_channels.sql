-- Studio Productions — reference data (niches, format packs, templates) and org-scoped
-- distribution channels. Extends studio_production_episodes with optional FKs for
-- shorts ops: target niche, chosen format template, and YouTube (etc.) channel link.
--
-- ADR alignment: still no vendor APIs; URLs and text are user/org stored (ADR-003).
-- Reference rows (niches / packs / templates) are inserted in migrations or by service role;
-- app users read via RLS, org members manage only channels and episodes.

-- ---------------------------------------------------------------------------
-- 1. Global niche catalog (user-facing “관심사 한 덩어리”)
-- ---------------------------------------------------------------------------

create table public.studio_niches (
  id uuid primary key default uuid_generate_v4(),
  slug text not null,
  display_name text not null,
  description text not null default '',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint studio_niches_slug_format check (slug ~ '^[a-z0-9][a-z0-9_-]*$'),
  constraint studio_niches_slug_unique unique (slug)
);

comment on table public.studio_niches is
  'Curated verticals for shorts planning (e.g. history_trivia). Seeded in migrations; UI lists active rows.';

create index idx_studio_niches_active_sort
  on public.studio_niches (is_active, sort_order, display_name);

-- ---------------------------------------------------------------------------
-- 2. Format pack (one per niche slice; groups 3–5 templates)
-- ---------------------------------------------------------------------------

create table public.studio_format_packs (
  id uuid primary key default uuid_generate_v4(),
  studio_niche_id uuid not null references public.studio_niches (id) on delete restrict,
  slug text not null,
  display_name text not null,
  description text not null default '',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint studio_format_packs_slug_format check (slug ~ '^[a-z0-9][a-z0-9_-]*$'),
  constraint studio_format_packs_niche_slug_unique unique (studio_niche_id, slug)
);

comment on table public.studio_format_packs is
  'A bundle of format templates under one niche; user picks a pack then a template row.';

create index idx_studio_format_packs_niche_active
  on public.studio_format_packs (studio_niche_id, is_active, sort_order);

-- ---------------------------------------------------------------------------
-- 3. Format template (single repeatable short pattern: hook structure, length, etc.)
-- ---------------------------------------------------------------------------

create table public.studio_format_templates (
  id uuid primary key default uuid_generate_v4(),
  format_pack_id uuid not null references public.studio_format_packs (id) on delete cascade,
  slug text not null,
  display_name text not null,
  target_duration_seconds integer null,
  hook_structure text not null default '',
  caption_style text not null default '',
  thumbnail_spec text not null default '',
  script_prompt_shell text not null default '',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint studio_format_templates_slug_format check (slug ~ '^[a-z0-9][a-z0-9_-]*$'),
  constraint studio_format_templates_duration_positive check (
    target_duration_seconds is null
    or target_duration_seconds between 5 and 600
  ),
  constraint studio_format_templates_pack_slug_unique unique (format_pack_id, slug)
);

comment on column public.studio_format_templates.hook_structure is
  'Human or LLM-facing spec for opening beat (plain text or lightweight markdown).';
comment on column public.studio_format_templates.script_prompt_shell is
  'Optional default body for script/prompt artifacts when spawning an episode from this template.';

create index idx_studio_format_templates_pack_active
  on public.studio_format_templates (format_pack_id, is_active, sort_order);

-- ---------------------------------------------------------------------------
-- 4. Org-scoped distribution channels (YouTube channel URL, label for UI)
-- ---------------------------------------------------------------------------

create table public.studio_distribution_channels (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  label text not null,
  platform text not null default 'youtube_shorts',
  channel_url text not null,
  notes text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint studio_distribution_channels_platform_check check (
    platform in (
      'youtube_shorts',
      'instagram_reels',
      'tiktok',
      'other'
    )
  ),
  constraint studio_distribution_channels_url_https check (channel_url ~ '^https://')
);

comment on table public.studio_distribution_channels is
  'Per-org links to creator channels; episodes may reference one for “open channel” and reporting.';

create index idx_studio_distribution_channels_org_sort
  on public.studio_distribution_channels (organization_id, sort_order, created_at desc);

-- ---------------------------------------------------------------------------
-- 5. Episodes: optional links to niche, format template, distribution channel
-- ---------------------------------------------------------------------------

alter table public.studio_production_episodes
  add column studio_niche_id uuid null references public.studio_niches (id) on delete set null,
  add column studio_format_template_id uuid null references public.studio_format_templates (id) on delete set null,
  add column studio_distribution_channel_id uuid null references public.studio_distribution_channels (id) on delete set null;

comment on column public.studio_production_episodes.studio_niche_id is
  'Selected vertical; may be set before a template is chosen (draft planning).';
comment on column public.studio_production_episodes.studio_format_template_id is
  'Chosen format pattern; pack and niche are joinable via studio_format_templates → studio_format_packs.';
comment on column public.studio_production_episodes.studio_distribution_channel_id is
  'Target channel for this short; must belong to the same organization as the episode.';

create index idx_studio_production_episodes_org_niche
  on public.studio_production_episodes (organization_id, studio_niche_id)
  where studio_niche_id is not null;

create index idx_studio_production_episodes_org_format_template
  on public.studio_production_episodes (organization_id, studio_format_template_id)
  where studio_format_template_id is not null;

create index idx_studio_production_episodes_org_channel
  on public.studio_production_episodes (organization_id, studio_distribution_channel_id)
  where studio_distribution_channel_id is not null;

-- Episodes: distribution channel org must match; if both niche and template are set, they must agree.
create or replace function public.studio_production_episodes_validate_studio_fks()
returns trigger
language plpgsql
as $$
declare
  pack_niche uuid;
  ch_org uuid;
begin
  if new.studio_distribution_channel_id is not null then
    select c.organization_id into ch_org
    from public.studio_distribution_channels c
    where c.id = new.studio_distribution_channel_id;

    if ch_org is null then
      raise exception 'studio_production_episodes: studio_distribution_channel_id not found';
    end if;

    if ch_org is distinct from new.organization_id then
      raise exception 'studio_production_episodes: distribution channel organization_id mismatch';
    end if;
  end if;

  if new.studio_format_template_id is not null and new.studio_niche_id is not null then
    select p.studio_niche_id into pack_niche
    from public.studio_format_templates t
    join public.studio_format_packs p on p.id = t.format_pack_id
    where t.id = new.studio_format_template_id;

    if pack_niche is null then
      raise exception 'studio_production_episodes: format template not found';
    end if;

    if pack_niche is distinct from new.studio_niche_id then
      raise exception 'studio_production_episodes: studio_niche_id does not match template pack niche';
    end if;
  end if;

  return new;
end;
$$;

create trigger trg_studio_production_episodes_validate_studio_fks
  before insert or update of
    organization_id,
    studio_niche_id,
    studio_format_template_id,
    studio_distribution_channel_id
  on public.studio_production_episodes
  for each row
  execute function public.studio_production_episodes_validate_studio_fks();

-- ---------------------------------------------------------------------------
-- 6. RLS: reference tables (read-only for authenticated)
-- ---------------------------------------------------------------------------

alter table public.studio_niches enable row level security;
alter table public.studio_format_packs enable row level security;
alter table public.studio_format_templates enable row level security;
alter table public.studio_distribution_channels enable row level security;

create policy "Authenticated users can read active studio_niches"
  on public.studio_niches
  for select
  to authenticated
  using (is_active = true);

-- Staff may need inactive rows later; add a separate policy or service role only.
create policy "Authenticated users can read active studio_format_packs"
  on public.studio_format_packs
  for select
  to authenticated
  using (is_active = true);

create policy "Authenticated users can read active studio_format_templates"
  on public.studio_format_templates
  for select
  to authenticated
  using (is_active = true);

-- Org members manage channels
create policy "Org members can select studio_distribution_channels"
  on public.studio_distribution_channels
  for select
  using (
    organization_id = public.user_organization_id()
    and public.user_organization_id() is not null
  );

create policy "Org members can insert studio_distribution_channels"
  on public.studio_distribution_channels
  for insert
  with check (
    organization_id = public.user_organization_id()
    and public.user_organization_id() is not null
  );

create policy "Org members can update studio_distribution_channels"
  on public.studio_distribution_channels
  for update
  using (
    organization_id = public.user_organization_id()
    and public.user_organization_id() is not null
  );

create policy "Org members can delete studio_distribution_channels"
  on public.studio_distribution_channels
  for delete
  using (
    organization_id = public.user_organization_id()
    and public.user_organization_id() is not null
  );

-- ---------------------------------------------------------------------------
-- 7. Seed: minimal niches + one pack + two templates (replace or extend in later migrations)
-- ---------------------------------------------------------------------------

insert into public.studio_niches (slug, display_name, description, sort_order)
values
  ('history_curiosity', '역사·궁금증', '한 줄 퀴즈·미스터리형 쇼츠', 10),
  ('workplace_memes', '직장 밈·공감', '사무실·협업 밈 기반', 20),
  ('science_facts', '과학 팩트', '짧은 설명·오해 깨기', 30)
on conflict (slug) do nothing;

insert into public.studio_format_packs (studio_niche_id, slug, display_name, description, sort_order)
select n.id, 'default', '기본 팩', '시작용 포맷 묶음', 0
from public.studio_niches n
where n.slug = 'history_curiosity'
on conflict (studio_niche_id, slug) do nothing;

insert into public.studio_format_templates (
  format_pack_id,
  slug,
  display_name,
  target_duration_seconds,
  hook_structure,
  caption_style,
  thumbnail_spec,
  script_prompt_shell,
  sort_order
)
select
  p.id,
  v.slug,
  v.display_name,
  v.target_duration_seconds,
  v.hook_structure,
  v.caption_style,
  v.thumbnail_spec,
  v.script_prompt_shell,
  v.sort_order
from public.studio_format_packs p
join public.studio_niches n on n.id = p.studio_niche_id and n.slug = 'history_curiosity'
cross join lateral (
  values
    (
      'twist_one_liner',
      '반전 한 줄',
      35,
      '첫 2초: 질문 제시 → 3초: 오답 암시 → 마지막 2초: 반전 정답 한 줄.',
      '상단 고정 훅, 하단 출처(간단)',
      '큰 숫자 또는 물음표 + 어두운 배경',
      '주제: {topic}\n0–2s 훅 질문:\n3–10s 맥락:\n10–30s 전개:\n30–35s 반전 결론:',
      0
    ),
    (
      'three_bullets',
      '팩트 3줄',
      45,
      '0–3s: 왜 지금 봐야 하는지 → 4–40s: 팩트 3개 (각 10–12s) → 41–45s: 한 줄 정리.',
      '불릿 이모지 금지, 숫자만',
      '3개 칸 그리드 썸네일',
      '주제: {topic}\n팩트1:\n팩트2:\n팩트3:\n마무리:',
      1
    )
) as v (
  slug,
  display_name,
  target_duration_seconds,
  hook_structure,
  caption_style,
  thumbnail_spec,
  script_prompt_shell,
  sort_order
)
where p.slug = 'default'
on conflict (format_pack_id, slug) do nothing;
