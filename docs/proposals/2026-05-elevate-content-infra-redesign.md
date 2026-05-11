# Elevate Content Infrastructure Redesign — Phase 1 (Audit + Proposal)

**Status:** Phase 1 partial — **D1 + D2 complete**. **D3 + D4 PENDING ADR-015** commit (전략/기획 session 작성 중).
**Effective:** 2026-05-11
**Owner:** founder (R)
**Reads / supersedes:** ADR-014 (Studio brand), ADR-012 (media-first), ADR-013 (CTA instrumentation), `memory-bank/operations-mode-2026-q2.md` (Studio Brand Identity section).
**Companion ADR:** [`docs/adr/ADR-016-content-infra-redesign.md`](../adr/ADR-016-content-infra-redesign.md) (stub).
**Phase 2 (build) commission:** 별도 — 본 proposal 승인 + ADR-015 land 후 13–17h estimate.

---

## TL;DR (Phase 1 partial)

- **Migrations 53개** chronologically inventoried — last is `052_drop_mice_legacy_tables.sql` (MICE legacy 5개 테이블 제거 완료).
- **Surviving 테이블 37개** audit 결과:
  - **KEEP (foundation): 9** — `organizations`, `profiles`, `audit_logs`, `organization_invitations`, `platform_email_settings`, `lemon_squeezy_processed_orders`, `content_product_lemon_links`, `organization_content_entitlements`, `content_products`.
  - **REUSE (essays/dispatches 인프라가 extend): 7** — `content_publications`, `content_items`, `content_sources`, `content_runs`, `content_item_source_map`, `newsletter_subscribers`, `waitlist_signups`.
  - **DEPRECATE (Prompt Studio era, Phase 2 revival 가능성): 19** — 모든 `studio_*` + `prompt_studio_beta_allowlist`. Schema reference 제외, data 보존, DROP X.
  - **DEPRECATE → conditional DROP (sign-off 후): 1** — `toss_payment_intents` (이미 `docs/operations/draft-drop-toss-payment-intents.sql`로 founder가 draft).
  - **별도 vertical / out of scope: 0** — 본 repo에는 가게점수 테이블 없음 (separate repo 정책 준수 확인).
- **D3 (architecture proposal) + D4 (cleanup plan)는 ADR-015 commit 후** 별도 turn에서 완성. 본 문서에 placeholder section 명시.

---

## 1. Founder-confirmed inputs

| Item | Value | Source |
|---|---|---|
| Repo absolute path | `/Users/rayleighko/Development/elevate/` | file system verify |
| Migration files path | `supabase/migrations/` | file system verify (53 files) |
| App code path | `src/app/` (Next.js 16 App Router), `src/actions/`, `src/lib/`, `workers/`, `scripts/` | file system verify |
| Email service decision | **Resend** (default, founder approved) | AskUserQuestion 2026-05-11 |
| ADR-015 status | **NOT committed** — 전략/기획 session 작성 중 (working tree clean of ADR-015 file). `memory-bank/operations-mode-2026-q2.md` + `tasks.md`는 modified 상태. | git status / glob |
| Output location | 본 proposal + `docs/adr/ADR-016-content-infra-redesign.md` stub | AskUserQuestion 2026-05-11 |

**Per founder decision**: ADR-015 부재 상태에서 D1 + D2만 우선 진행. D3 (essays/dispatches/subscribers 새 schema) + D4 (phased cleanup)는 ADR-015 strategic decisions (essays vs dispatches scope, single-subscription model, voice 정밀화 결과 적용) 확정 후 작성. 현재 작성 시 ADR-015 land 후 rework risk 발생.

---

## 2. Deliverable 1 — Migration file inventory

`supabase/migrations/` chronological. 53개 파일 (000–052).

| # | Filename | Summary | Era |
|---|---|---|---|
| 000 | `000_pre_init_cleanup.sql` | Destructive dev/staging reset (drop public schema) | foundation |
| 001 | `001_initial_schema.sql` | Initial schema: organizations, profiles, **+ MICE (venues/events/sessions/attendees/session_attendees — dropped in 052)** | foundation |
| 002 | `002_profiles_select_own.sql` | RLS: authenticated user can read own profile row | foundation |
| 003 | `003_session_attendees_policies.sql` | RLS: organizers can link sessions↔attendees (MICE — dropped in 052) | foundation (MICE-coupled) |
| 004 | `004_profiles_rls_no_recursion.sql` | Fix: profiles RLS infinite recursion (SECURITY DEFINER helpers) | foundation |
| 005 | `005_settings_org_update_and_profile_prefs.sql` | Org name update for admin/organizer; profile email digest pref | foundation |
| 006 | `006_organization_invitations.sql` | `organization_invitations` (email + token) | foundation |
| 007 | `007_audit_logs.sql` | `audit_logs` append-only org-scoped trail (service role inserts) | foundation |
| 008 | `008_toss_payment_intents.sql` | Toss Payments PoC: `toss_payment_intents` table | payment infra |
| 009 | `009_content_products.sql` | `content_products` + `organization_content_entitlements` (AI pivot premium catalog MVP) | content management era |
| 010 | `010_content_product_kind.sql` | `content_products.product_kind` enum (ebook-first) | content management era |
| 011 | `011_toss_payment_intent_content_product.sql` | Link `toss_payment_intents` ↔ `content_products` for entitlement grant | payment infra |
| 012 | `012_content_product_storage_path.sql` | `content_products.storage_path` for signed download URLs | content management era |
| 013 | `013_waitlist_signups.sql` | `waitlist_signups` (newsletter / early-access emails, service role inserts only) | newsletter foundation |
| 014 | `014_profiles_ui_locale.sql` | `profiles.ui_locale` (next-intl preferred locale) | foundation |
| 015 | `015_platform_email_settings.sql` | `platform_email_settings` singleton (waitlist BCC etc.) | newsletter foundation |
| 016 | `016_prompt_studio_beta_allowlist.sql` | `prompt_studio_beta_allowlist` (STUDIO_BETA_REQUIRE_ALLOWLIST gate) | Prompt Studio era |
| 017 | `017_studio_productions.sql` | `studio_production_episodes` + `studio_production_artifacts` (org-scoped Studio Productions deliverables) | Prompt Studio era |
| 018 | `018_lemon_squeezy_processed_orders.sql` | `lemon_squeezy_processed_orders` (webhook idempotency) | payment infra |
| 019 | `019_content_product_lemon_links.sql` | `content_product_lemon_links` (Lemon variant ↔ catalog, service role only) | payment infra |
| 020 | `020_content_products_original_file_name.sql` | `content_products.original_file_name` (Unicode-safe download name) | content management era |
| 021 | `021_lemon_squeezy_processed_orders_org_select.sql` | RLS: org members can read Lemon order idempotency | payment infra |
| 022 | `022_content_product_prompt_surface_playbook.sql` | First `web_only` ebook SKU seed (Prompt Surface Playbook) | content management era |
| 023 | `023_studio_niches_format_packs_channels.sql` | `studio_niches`, `studio_format_packs`, `studio_format_templates`, `studio_distribution_channels` + episode FKs | Prompt Studio era |
| 024 | `024_studio_org_provider_connections.sql` | `studio_org_provider_connections` (per-org encrypted provider creds, ADR-006) | Prompt Studio era |
| 025 | `025_studio_org_provider_anthropic.sql` | Provider enum: add `anthropic` | Prompt Studio era |
| 026 | `026_studio_channel_metadata_llm_threads.sql` | `studio_episode_llm_threads` + extend `studio_distribution_channels` (YouTube longform, X) | Prompt Studio era |
| 027 | `027_studio_episode_draft_snapshots.sql` | `studio_episode_draft_snapshots` (immutable hook/title/script version history) | Prompt Studio era |
| 028 | `028_studio_episode_draft_snapshots_source_superseded.sql` | Snapshot source enum extension | Prompt Studio era |
| 029 | `029_studio_episode_draft_templates.sql` | `studio_episode_draft_templates` (org-scoped LLM prompt templates) | Prompt Studio era |
| 030 | `030_studio_provider_elevenlabs.sql` | Provider enum: add `elevenlabs` | Prompt Studio era |
| 031 | `031_studio_youtube_channel_tokens.sql` | `studio_youtube_channel_tokens` (encrypted OAuth refresh/access tokens, Phase S4) | Prompt Studio era |
| 032 | `032_studio_episode_performance.sql` | `studio_episode_performance` (YT Analytics snapshots, Phase S5) | Prompt Studio era |
| 033 | `033_studio_projects.sql` | `studio_projects` (Org > Project > Episode hierarchy, T1) | Prompt Studio era |
| 034 | `034_studio_video_assembly_jobs.sql` | `studio_video_assembly_jobs` (async FFmpeg jobs) | Prompt Studio era |
| 035 | `035_studio_video_assembly_jobs_realtime.sql` | Replica identity full + realtime broadcast | Prompt Studio era |
| 036 | `036_studio_episode_pipeline_prefs.sql` | `studio_production_episodes.pipeline_prefs` JSONB (scene/model/TTS prefs) | Prompt Studio era |
| 037 | `037_profiles_dashboard_access.sql` | `profiles.can_use_dashboard` explicit allowlist | foundation |
| 038 | `038_studio_org_provider_image_providers.sql` | Provider enum: FLUX (Replicate, fal.ai), Seedream (BytePlus) | Prompt Studio era |
| 039 | `039_studio_projects_character_bible.sql` | `studio_projects.character_bible` JSONB + master ref image (ADR-009) | Prompt Studio era |
| 040 | `040_studio_org_provider_buffer.sql` | Provider enum: add `buffer` (scheduled posts Phase 3) | Prompt Studio era |
| 041 | `041_studio_scheduled_posts.sql` | `studio_scheduled_posts` (Buffer GraphQL publish queue) | Prompt Studio era |
| 042 | `042_content_ebook_delivery_and_first_open.sql` | `content_products.delivery_mode` + `content_ebook_first_opens` (refund policy) | content management era |
| 043 | `043_catalog_purchase_allowlist.sql` | `catalog_purchase_allowlist` (CATALOG_CHECKOUT_REQUIRE_ALLOWLIST gate) | content management era |
| 044 | `044_studio_video_assembly_stale_recovery.sql` | Stale recovery columns on `studio_video_assembly_jobs` (worker crash safety) | Prompt Studio era |
| 045 | `045_user_blog_subscriptions.sql` | `user_blog_subscriptions` + `user_blog_subscription_webhook_events` (Lemon recurring blog access) | content management era / subscription |
| 046 | `046_user_blog_subscriptions_payment_columns.sql` | Migrate Lemon-specific columns → provider-agnostic `payment_*` (non-breaking) | content management era / subscription |
| 047 | `047_profiles_loading_spinner_tempo.sql` | `profiles.loading_spinner_tempo` UI pref | foundation (UX pref) |
| 048 | `048_profiles_sidebar_icon_tone.sql` | `profiles.sidebar_icon_tone` UI pref | foundation (UX pref) |
| 049 | `049_admin_content_ops_foundation.sql` | `newsletter_subscribers`, `content_sources`, `content_items`, `content_item_source_map`, `content_runs`, `content_publications` (admin newsletter/blog ops scaffolding) | newsletter foundation |
| 050 | `050_content_runs_retry_run_type.sql` | `content_runs.run_type` retry typing | newsletter foundation |
| 051 | `051_seed_curated_content_sources.sql` | Replace smoke fixtures with curated production feeds (idempotent seed) | newsletter foundation |
| 052 | `052_drop_mice_legacy_tables.sql` | DROP `session_attendees`, `sessions`, `attendees`, `events`, `venues` (MICE removed) | mixed (cleanup) |

**Era distribution:**

- foundation: 11 (000, 001, 002, 003*, 004, 005, 006, 007, 014, 037, 047, 048)
- payment infra: 6 (008, 011, 018, 019, 021) + 1 cross-cut (042 has payment hooks)
- content management era: 9 (009, 010, 012, 020, 022, 042, 043, 045, 046)
- Prompt Studio era: **22** (016, 017, 023–036 ex 037, 038–041, 044) — 가장 큰 chunk
- newsletter foundation: 5 (013, 015, 049, 050, 051)
- mixed cleanup: 1 (052)

\*003은 MICE-coupled — 052에서 정책 함께 dropped.

---

## 3. Deliverable 2 — Current schema audit

**Method:**
1. Extract `CREATE TABLE` from all migrations (post-052 surviving set).
2. `grep -rE '...table_name...' src/ workers/ scripts/` — production code paths only (excludes `node_modules`, `.next`, `tests/` for "currently used" determination — tests included separately if relevant).
3. Classify per ADR-014 hierarchy:
   - **KEEP** — foundational, no replacement plan.
   - **REUSE** — essays/dispatches 인프라가 ALTER로 extend 가능.
   - **DEPRECATE** — 사용 X 또는 Prompt Studio era. Schema reference 제외, data 보존 (DROP 금지).
   - **DROP** — data 가치 0 + cleanup 가치 high (rare; sign-off 필요).

**Code reference count = 직접 grep matches (`'<table>'` 또는 `from('<table>')` 등).** Counts는 절대 사용 빈도가 아닌 *touch surface size* indicator.

### 3.1 Foundation — KEEP (9)

| Table | Era | Code refs | Recommendation | Rationale |
|---|---|---|---|---|
| `organizations` | foundation (001) | 27 | **KEEP** | Org tenancy primary table. 모든 RLS의 base. |
| `profiles` | foundation (001, +many ALTER) | 67 | **KEEP** | User identity + UI prefs + dashboard access. 가장 heavily integrated table. |
| `audit_logs` | foundation (007) | 3 | **KEEP** | Append-only audit trail. SOX/ops legibility 위해 보존. 새 essays/dispatches actions도 동일 trail에 logging 권장 (별도 table 만들지 X). |
| `organization_invitations` | foundation (006) | 7 | **KEEP** | Invitation flow 활성. |
| `platform_email_settings` | newsletter foundation (015) | 4 | **KEEP** | Singleton row. Resend integration도 본 settings로 unify 가능 (Phase 2 검토). |
| `lemon_squeezy_processed_orders` | payment infra (018) | 3 | **KEEP** | Webhook idempotency. 활성. |
| `content_product_lemon_links` | payment infra (019) | 8 | **KEEP** | Lemon variant ↔ catalog 매핑 활성. |
| `organization_content_entitlements` | content era (009) | 10 | **KEEP** | Ebook entitlement core. ADR-012의 morning-ops strip이 이 테이블을 surface. |
| `content_products` | content era (009, +many) | 28 | **KEEP** | Ebook/digital catalog primary table. 활성. ADR-014와 conflict X (Studio가 빌드한 자료 distribution 채널 중 하나). |

### 3.2 Newsletter / content ops — REUSE (7)

> 본 그룹이 D3 (새 essays/dispatches 인프라)의 **REUSE 후보**. ADR-015 commit 시 ALTER로 extend할지 별도 테이블 만들지 final decision.

| Table | Era | Code refs | Recommendation | Rationale |
|---|---|---|---|---|
| `content_publications` | newsletter foundation (049) | 10 | **REUSE candidate** | 이미 publication log scaffolding 존재. Essays + Dispatches 발행 로그를 unify할지 vs 분리 테이블로 두고 본 테이블은 deprecation할지 ADR-015 결정 의존. |
| `content_items` | newsletter foundation (049) | 50 | **REUSE candidate** | Content queue (대기열/draft/approved/published). Essays + Dispatches가 동일 queue를 share할 수 있음. 단 `kind` discriminator column 추가 필요 (essay/dispatch/blog). |
| `content_sources` | newsletter foundation (049, 051) | 17 | **REUSE** | RSS/curated feed registry. Essays/Dispatches의 source attribution에도 그대로 활용 가능. |
| `content_runs` | newsletter foundation (049, 050) | 18 | **REUSE** | Pipeline run logs (ingest/aggregate/publish/retry). Cron handlers에서 그대로 logging target. |
| `content_item_source_map` | newsletter foundation (049) | 12 | **REUSE** | content_item ↔ content_source N:M 매핑. 그대로 사용. |
| `newsletter_subscribers` | newsletter foundation (049) | 10 | **REUSE candidate (단일 subscription model로 promote)** | ADR-015이 "Essays + Studio Dispatch 단일 구독" 결정 가정 시 → 본 테이블이 unified `subscribers` 역할. 컬럼 추가 (`channels jsonb` 또는 `essays_opted_in bool`, `dispatches_opted_in bool`) 필요. |
| `waitlist_signups` | newsletter foundation (013) | 8 | **REUSE / merge candidate** | ADR-012 morning-ops strip이 본 테이블 surface. ADR-015이 단일 subscription model 채택 시 `newsletter_subscribers`로 merge할지 별개로 둘지 결정. *현재는 KEEP 유지, merge는 D4 cleanup phase에서 평가.* |

### 3.3 Prompt Studio era — DEPRECATE (NOT DROP) (19)

> ADR-014: *Prompt Studio thesis archived (deleted 아님). North Star pivot history 보존, future vertical candidate revival 가능.* 본 그룹은 **schema reference만 제외**하고 **data + table 보존**. Phase 2 revival 시 schema reference로 활용. DROP 절대 금지.

| Table | Era | Code refs | Recommendation | Rationale |
|---|---|---|---|---|
| `prompt_studio_beta_allowlist` | Prompt Studio (016) | 11 | **DEPRECATE** | STUDIO_BETA_REQUIRE_ALLOWLIST gate. ADR-014 paused → schema 보존, code path quarantine (admin-only, no marketing surface). |
| `studio_production_episodes` | Prompt Studio (017, 036) | 26 | **DEPRECATE** | Studio Productions 핵심 entity. 코드 활성하나 ADR-014 hierarchy로 archived. *주의*: Phase 2 revival 가능성 가장 높은 테이블. Schema ref 보존 필수. |
| `studio_production_artifacts` | Prompt Studio (017) | **73** | **DEPRECATE** | 가장 heavily integrated Prompt Studio 테이블 (video pipeline, scene render, TTS, YouTube upload, Buffer publish). ADR-014 archived → admin/dev-only 경로 quarantine. *Phase 2 revival 시 가장 많은 code resurrect 필요.* |
| `studio_niches` | Prompt Studio (023) | 4 | **DEPRECATE** | Reference data (niches catalog). |
| `studio_format_packs` | Prompt Studio (023) | 2 | **DEPRECATE** | Reference data. |
| `studio_format_templates` | Prompt Studio (023) | 2 | **DEPRECATE** | Reference data. |
| `studio_distribution_channels` | Prompt Studio (023, 026) | 6 | **DEPRECATE** | Per-org channel registry (YouTube, X). |
| `studio_org_provider_connections` | Prompt Studio (024–025, 030, 038, 040) | 12 | **DEPRECATE** | Encrypted per-org provider creds (Anthropic, ElevenLabs, FLUX, Buffer 등). *주의*: encrypted secrets 포함 — DROP 시 key rotation 필요. DEPRECATE 권장. |
| `studio_episode_llm_threads` | Prompt Studio (026) | 3 | **DEPRECATE** | Per-episode LLM conversation audit trail. |
| `studio_episode_draft_snapshots` | Prompt Studio (027, 028) | 5 | **DEPRECATE** | Immutable hook/title/script version history. |
| `studio_episode_draft_templates` | Prompt Studio (029) | 6 | **DEPRECATE** | Org-scoped LLM prompt templates. |
| `studio_youtube_channel_tokens` | Prompt Studio (031) | 7 | **DEPRECATE** | YouTube OAuth tokens. **Encrypted** — DROP 시 token rotation. DEPRECATE. |
| `studio_episode_performance` | Prompt Studio (032) | 2 | **DEPRECATE** | YT Analytics snapshots. |
| `studio_projects` | Prompt Studio (033, 039) | 21 | **DEPRECATE** | Org > Project > Episode hierarchy + character bible. |
| `studio_video_assembly_jobs` | Prompt Studio (034, 035, 044) | 15 | **DEPRECATE** | Async FFmpeg job queue. Worker process active 시 quarantine 주의. |
| `studio_scheduled_posts` | Prompt Studio (041) | 20 | **DEPRECATE** | Buffer GraphQL publish queue. |

### 3.4 Payment legacy — DEPRECATE → conditional DROP (1)

| Table | Era | Code refs | Recommendation | Rationale |
|---|---|---|---|---|
| `toss_payment_intents` | payment infra (008, 011) | **0** | **DEPRECATE → DROP after sign-off** | ADR-005 (Lemon-first, Toss deferred) + commit `75c58be` (remove Toss PoC) + 이미 founder가 `docs/operations/draft-drop-toss-payment-intents.sql`로 drop 스크립트 작성. 코드 ref 0 (database.types.ts auto-generated만). **Audit/finance/legal sign-off 후 DROP 안전.** Phase 1에서는 DEPRECATE classification 유지, D4 cleanup plan에서 phased drop 명시. |

### 3.5 Content management — KEEP (already covered in 3.1)

`content_ebook_first_opens` (042, 1 ref), `catalog_purchase_allowlist` (043, 8 refs), `user_blog_subscriptions` (045/046, 8 refs), `user_blog_subscription_webhook_events` (045/046, 4 refs)는 active subscription/refund flow. **모두 KEEP** (3.1에 누락 — 보충):

| Table | Era | Code refs | Recommendation | Rationale |
|---|---|---|---|---|
| `content_ebook_first_opens` | content era (042) | 1 | **KEEP** | Refund policy audit trail. Low ref count이지만 legal/refund flow에 필요. |
| `catalog_purchase_allowlist` | content era (043) | 8 | **KEEP** | Active checkout gate. |
| `user_blog_subscriptions` | content era (045, 046) | 8 | **KEEP / REUSE candidate for dispatches** | Lemon recurring blog access. ADR-015이 essays + dispatches 단일 구독 채택 시 본 테이블의 subscription 모델 (provider-agnostic payment 컬럼 포함)을 dispatches recurring으로 확장 가능. |
| `user_blog_subscription_webhook_events` | content era (045, 046) | 4 | **KEEP** | Webhook idempotency for recurring billing. |

**3.1 + 3.5 합계 = 13 KEEP** (9 foundation + 4 active content/subscription).

### 3.6 Out of scope — 가게점수 (vertical product)

가게점수 관련 테이블 본 repo에 **없음** — `operations-mode-2026-q2.md`의 분리 repo 정책 (no code import from Elevate, no 가게점수 work in this repo) 준수 확인. 본 인프라 scope 외, 변경 X.

### 3.7 Audit summary

| Recommendation | Count | Tables |
|---|---|---|
| KEEP | 13 | organizations, profiles, audit_logs, organization_invitations, platform_email_settings, lemon_squeezy_processed_orders, content_product_lemon_links, organization_content_entitlements, content_products, content_ebook_first_opens, catalog_purchase_allowlist, user_blog_subscriptions, user_blog_subscription_webhook_events |
| REUSE (essays/dispatches infra extends) | 7 | content_publications, content_items, content_sources, content_runs, content_item_source_map, newsletter_subscribers, waitlist_signups |
| DEPRECATE (Prompt Studio era) | 16 | prompt_studio_beta_allowlist + 15 studio_* tables |
| DEPRECATE → conditional DROP | 1 | toss_payment_intents |
| **Total surviving (post-052)** | **37** | (from 53 migrations, minus 5 MICE drops + 11 ALTER-only migrations) |

---

## 4. Deliverable 3 — New content infra architecture proposal

**[PENDING ADR-015 commit]**

본 section은 ADR-015 (Content Product Design — 전략/기획 session 작성 중) commit 후 별도 turn에서 완성. ADR-015이 lock해야 할 strategic decisions:

1. **Essays vs Dispatches scope boundary** — 두 product의 voice/cadence/length 분리 정도. 단일 `content_items.kind` discriminator로 충분 vs 별도 테이블 분리 필요?
2. **Single subscription model** (founder가 implied함 — task description의 "단일 구독 model — both products together"). 본 결정이 lock되면 `newsletter_subscribers` extension 가능. 단 dispatches recurring billing이 essays free와 분리 시 `user_blog_subscriptions`도 통합 대상.
3. **Voice 정밀화 적용 결과** (operations-mode-2026-q2.md의 다음 3개 post 평가) — voice가 essays/dispatches에 differential 적용 여부 결정.
4. **Cron schedule lock** — Thursday NY 9AM dispatch cadence가 ADR-015에서 final인지 (operations-mode 기존 "Thursday newsletter 1×/week" 유지 가정).
5. **Author model** — 단일 founder author vs multi-author (Studio thread definition Agenda B 결과 의존).

ADR-015 commit 후 본 section에 작성 예정 항목 (task spec D3 a~g):

- **a. 새 vs reuse decision per table + reasoning** — D2 audit 결과 반영하여 essays/dispatches/subscribers/dispatch_sends 각 table별 decision matrix.
- **b. SQL migration draft** (실행 X) — `053_essays_table.sql`, `054_dispatches_table.sql`, `055_subscribers_extend.sql` (또는 reuse 결정 시 ALTER-only), `056_dispatch_sends_log.sql` 형식.
- **c. RLS policies** — Supabase best practice (service-role-only writes, anon SELECT for published essays, authenticated SELECT for own subscription state).
- **d. Indexes** — `essays(status, scheduled_publish_at)`, `subscribers(email)`, `dispatches(status, scheduled_send_at)`, `dispatch_sends(dispatch_id, subscriber_id)`.
- **e. API route signatures** (Next.js 16 App Router):
  - `/api/essays` (CRUD)
  - `/api/dispatches` (CRUD)
  - `/api/subscribers` (subscribe/unsubscribe)
  - `/api/cron/publish-scheduled-essays` (hourly)
  - `/api/cron/send-dispatch` (Thursday, DST-aware NY 9AM check)
- **f. Cron handler logic outline** — Vercel cron Thursday 13:00 UTC year-round + handler 안에서 NY hour check (EST: Nov–Mar / EDT: Mar–Nov 자동 처리). Vercel timezone은 UTC, DST 자동 처리는 Intl.DateTimeFormat with `America/New_York` timezone.
- **g. Email service trade-off matrix** — **Resend (founder pre-approved default)** vs Postmark vs SendGrid:
  - Resend: Next.js/Vercel native, React Email integration, 낮은 cost, Thursday 1×/week + hourly essay publishing volume에 충분. Deliverability 일반 transactional 수준.
  - Postmark: Transactional deliverability 강점, open/click tracking 우수. Resend 대비 더 비싸나 reliability 우선 시.
  - SendGrid: Enterprise scale 유리, marketing automation 풍부. Setup 복잡 + Vercel less native.
  - **Recommendation**: Resend (founder approved). Postmark/SendGrid는 dispatches 발송 reliability issue (open rate 급락) 발생 시 fallback 검토.

**Phase 2 build estimate (별도 commission): 13–17h** — task spec 명시.

---

## 5. Deliverable 4 — Cleanup plan

**[PENDING ADR-015 commit — partial draft below for D2 → D4 traceability]**

D2 (DEPRECATE) 결과를 phased cleanup으로 변환. ADR-015 land 후 final lock; 현재는 *informational draft only*.

| Phase | Action | Target tables | Rationale |
|---|---|---|---|
| **Immediate (W1–W2)** | Schema reference 제외 from 새 admin/UI surfaces. Code grep verify zero new references. Quarantine to admin-only routes. | `studio_video_assembly_jobs`, `studio_youtube_channel_tokens`, `studio_scheduled_posts`, `studio_episode_performance`, `studio_episode_llm_threads` (Prompt Studio video/distribution pipeline — least likely to revive in Phase 2 essay/dispatch context) | 가장 외부 surface 노출 적은 sub-pipeline. UI에서 hidden, worker stop 가능. |
| **W4–W8** | Founder review for `prompt_studio_beta_allowlist` deprecation banner. Dashboard route gating decision. | `prompt_studio_beta_allowlist` | Beta gate가 essays/dispatches 발행 인프라와 conflict 시 disable. Phase 2 revival 시 다시 enable 가능. |
| **W4–W8** | DROP `toss_payment_intents` after audit/finance/legal sign-off. `docs/operations/draft-drop-toss-payment-intents.sql` 이미 founder draft 존재 — 본 phase에서 promotion to migration `053_drop_toss_payment_intents.sql` 검토. | `toss_payment_intents` | Code refs 0, ADR-005 supersede, 이미 draft script 존재. **유일한 DROP 권장 candidate.** |
| **Indefinite hold (Phase 2 revival 후보)** | Data + schema 보존. 어떤 cleanup도 X. Schema reference만 새 코드에서 제외. | `studio_production_episodes`, `studio_production_artifacts`, `studio_projects`, `studio_org_provider_connections` (encrypted secrets), `studio_niches`, `studio_format_packs`, `studio_format_templates`, `studio_distribution_channels`, `studio_episode_draft_snapshots`, `studio_episode_draft_templates` | ADR-014: Prompt Studio = Phase 2 vertical candidate. 본 그룹 revival 시 character bible / project hierarchy / draft history 재활용 highest value. **DROP 절대 금지.** |
| **Indefinite hold (subscription merge 평가)** | `waitlist_signups` ↔ `newsletter_subscribers` merge 가능성 evaluate. Merge 시 `waitlist_signups` deprecated, data backfill. *ADR-015 단일 구독 model 확정 시.* | `waitlist_signups` (potentially) | ADR-012 morning-ops strip이 surface 중. Merge는 strip 재작업 동반. ADR-015 + Phase 2 build 동시 진행. |

**특별 주의 (ADR-014 hierarchy compliance):**

- `prompt_studio_*` — DEPRECATE, NOT DROP. Phase 2 revival 가능성 명시. ✓
- `studio_episode_*`, `studio_production_*` — Prompt Studio 콘텐츠 자동화 파이프라인. 사용 0 verify 후 DEPRECATE. ✓ (`studio_production_artifacts` 73 refs은 *현재 사용*이지만 ADR-014 hierarchy로 archived; quarantine 권장.)
- 가게점수 관련 테이블 — 본 repo에 없음 (separate repo 정책). 변경 X. ✓

---

## 6. Open questions (ADR-015 commit 시 resolve)

1. **Single subscription model 확정** — `newsletter_subscribers` extend vs 별도 `subscribers` 테이블 신설?
2. **Essays + Dispatches kind discriminator** — `content_items.kind` 컬럼 추가 vs 별도 `essays` / `dispatches` 테이블?
3. **Dispatch_sends log 별도 테이블** vs `content_runs` 활용?
4. **`waitlist_signups` merge timing** — Phase 2 build 동시 vs ADR-015 외 별도 ADR로 분리?
5. **`studio_production_artifacts` quarantine 시점** — 73 refs를 모두 admin-only 경로로 옮기는 작업이 V0.5 ship priority와 conflict X 확인 필요.
6. **Resend account provisioning** — founder가 Resend account ready인지 확인. Dispatches sender domain DNS (SPF/DKIM/DMARC) setup 시점 ADR-015 OR Phase 2 build에서 cover?

---

## 7. Constraints adherence

| Constraint | Status |
|---|---|
| ADR-015 commit 받은 후 시작 | **D1 + D2만 진행** (founder decision). D3 + D4는 placeholder + open questions만. ✓ |
| Phase 2 (실제 빌드) 별도 commission. 13–17h estimate | Section 4에 명시. ✓ |
| V0.5 ship (W1 D7) priority — 본 작업이 V0.5 build를 block X | 본 Phase 1은 read-only audit. 코드 변경/migration 실행 X. V0.5 build 무관. ✓ |
| ADR-014 + ADR-015과 conflict하는 결정 X | ADR-014: Prompt Studio DEPRECATE (NOT DROP), 가게점수 별도 repo, Studio brand framing 모두 준수. ADR-015은 commit 전 — D3/D4 보류로 conflict 차단. ✓ |

---

## 8. Next session handoff (ADR-015 land 후)

ADR-015 commit 시 founder가 본 proposal을 다시 trigger. 다음 turn에서:

1. ADR-015 read + open questions (Section 6) resolve.
2. D3 a–g 완성 (architecture proposal, SQL draft, RLS, indexes, API routes, cron logic, email service final pick).
3. D4 phased cleanup table을 informational draft → final lock으로 promote.
4. 본 proposal status: "Phase 1 partial" → "Phase 1 complete".
5. Phase 2 build commission 별도 task로 hand-off.

---

## Appendix A — Verification methodology

- **Migration list**: `ls supabase/migrations/*.sql` (53 files, 000–052).
- **Table extraction**: `grep -hE '^(create table|CREATE TABLE)' supabase/migrations/*.sql` + DROP filter from 052.
- **Code reference grep**: `grep -rE "['\"\`]<table>['\"\`]|\.from\(['\"\`]<table>|table\(['\"\`]<table>" src/ scripts/ workers/`. 본 pattern은 string literal 매칭 — type-only references (database.types.ts)는 제외 의도적.
- **Counts are touch surface, not call frequency.** High count (e.g. `studio_production_artifacts: 73`)이 active production 의미하지 않음 — ADR-014 hierarchy로 분류.
- **Out of scope verification**: 가게점수 관련 grep — `grep -ri "가게점수\|gagejumsoo\|store_score" src/ supabase/` zero results 가정 (separate repo 정책 confirm).

## Appendix B — File system inputs

- ADR-014: `docs/adr/ADR-014-elevate-studio-brand.md` (commit `9469a8b`, 2026-05-08)
- ADR-012: `docs/adr/ADR-012-positioning-2026-q2-scenario-a-media-first.md`
- ADR-013: `docs/adr/ADR-013-marketing-cta-instrumentation-phase-1.md`
- Operations mode: `memory-bank/operations-mode-2026-q2.md` (Studio Brand Identity section appended 2026-05-08; working tree currently modified)
- Pivot history: `memory-bank/creative-elevate-ai-pivot.md` (superseded header)
- Tasks SoT: `memory-bank/tasks.md` (working tree currently modified)
- Toss drop draft: `docs/operations/draft-drop-toss-payment-intents.sql`

---

*Document version: Phase 1 partial (D1 + D2). Updated when ADR-015 lands.*
