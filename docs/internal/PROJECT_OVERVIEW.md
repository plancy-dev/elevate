# Elevate Project Overview

> 작성일: 2026-04-27 · 분석 기준 커밋: `324c0f8`
> 신규 합류자/이해관계자가 코드를 빠르게 파악하고 어디부터 손대야 할지 판단하기 위한 **프로젝트 지도**.

이 문서는 정적 스냅샷입니다. 최신 상태는 [`memory-bank/tasks.md`](../../memory-bank/tasks.md), [`memory-bank/activeContext.md`](../../memory-bank/activeContext.md), [`memory-bank/progress.md`](../../memory-bank/progress.md)를 SoT로 봅니다.

---

## 0. 한 줄 요약

**Elevate**는 Next.js 16 + Supabase 기반 **B2B AI 콘텐츠·워크플로우 자동화 SaaS**. 과거 MICE Postgres 도메인은 제거되었고, **AI Studio**(영상 생성 + e-book 판매)·**Prompt Studio** 피벗 축이 중심입니다.

---

## 1. 제품 비전 & 피벗 전략

North Star: [`memory-bank/creative-elevate-ai-pivot.md`](../../memory-bank/creative-elevate-ai-pivot.md)

- **포지셔닝**: 단기는 Prompt Studio + e-book(현금흐름·신뢰), 장기는 B2B 에이전트 워크스페이스(데이터 해자)
- **4단 플라이휠**: 양질 콘텐츠 공급 → 저CAC 획득 → 조직 단위 과금 → 데이터 누적 → 추천 품질 향상
- **듀얼 GTM**: Bottom-up PLG(개별 실무자 셀프서브) + Top-down B2B(조직 거버넌스/높은 ACV)
- **로드맵 단계**: 지금=Studio 내러티브·결제·인프라 / 다음=Prompt Studio MVP / 나중=에이전트 워크스페이스·노코드 빌더·마켓플레이스

---

## 2. 사용자 기능 인벤토리 (53개 페이지 라우트)

### 마케팅 (공개, `[locale]` i18n)
홈 · pricing · product/[slug] · solutions/[slug] · blog/[slug] · case-studies · demo · about · careers · contact · compliance · privacy · security · terms

### 인증
login · signup · forgot-password · access-pending · auth/callback · update-password · invite

### 대시보드 (입주자용)
- **Productions 워크벤치** — 에피소드 리스트, 신규 생성, `[episodeId]` 상세, channels(배포), integrations(자격증명), projects(템플릿/캐릭터 바이블)
- **Library** — `[slug]` 상세 / read 뷰어 / checkout (**Lemon Squeezy** hosted)
- **Billing** — purchases · success · fail
- **운영** — settings · team · help · audit · organization/audit
- **레거시 placeholder** — studio · admin (대시보드 내)

### 어드민 (플랫폼 운영)
audit · content · lemon-webhook · purchase-allowlist · prompt-studio-allowlist · waitlist (총 7개)

### API 라우트
auth/dashboard-entitlement · content/[productId]/download · integrations/youtube/oauth(start+callback) · studio/improve · waitlist · webhooks/lemonsqueezy · webhooks/polar

---

## 3. 아키텍처 & 핵심 데이터 흐름

### 레이어
- **프레젠테이션**: App Router RSC + next-intl + Tailwind v4 + Radix UI
- **서버 액션**: [`src/actions/`](../../src/actions/) — Studio 도메인 22개(`studio-*.ts`)
- **도메인 라이브러리**: [`src/lib/studio-productions/`](../../src/lib/studio-productions/) 71파일
- **외부 어댑터**: [`src/lib/studio-integrations/providers/`](../../src/lib/studio-integrations/providers/) — runway/elevenlabs/youtube/buffer/images
- **데이터 액세스**: [`src/lib/data/`](../../src/lib/data/), [`src/lib/supabase/`](../../src/lib/supabase/)
- **백그라운드 워커**: [`workers/video-assembly/`](../../workers/video-assembly/) (FFmpeg, Fly.io)
- **데이터 저장**: Supabase Postgres(RLS) + Storage 버킷

### Studio 영상 파이프라인 (제품의 심장)

```
[A] Episode 생성 ─── studio-productions.ts:43        → episodes (status=draft)
[B] LLM 플랜    ─── studio-episode-llm.ts            → artifacts (role=script_draft, source=llm)
                    └─ scene-llm-planner.ts:24       (OpenAI→Anthropic 폴백, 재시도 0회)
[C] 이미지 생성  ─── studio-scene-images.ts:116      → artifacts (role=scene_keyframe_first/last)
                    └─ providers/images/registry.ts:33 (Gemini/FLUX×2/SeedDream 4분기)
[D] I2V        ─── studio-scene-i2v.ts:40            → artifacts (role=scene_clip, source=runway_i2v)
                    └─ runway-image-to-video.ts       (SDK waitUntilDone 폴링)
[E] TTS        ─── studio-tts.ts:75                  → artifacts (role=tts_audio)
                    └─ tts-chunked-pipeline.ts        (timed_script 있을 때만 청크)
[F] 자막       ─── studio-social-captions.ts         → artifacts (role=subtitle_srt)
[G] 어셈블리    ─── studio-video-assembly.ts:44       → video_assembly_jobs (큐잉, 비동기)
                    └─ workers/video-assembly/run.ts:67 (RPC claim, 2.5s 폴링)
[H] 배포       ─── studio-youtube.ts:74               → YouTube (private 업로드, HITL)
                    studio-buffer.ts:142              → scheduled_posts (Promise.all fan-out)
```

### 동시성 패턴

| 패턴 | 위치 | 의도 |
|---|---|---|
| **RPC FIFO claim** | `claim_studio_video_assembly_job()` | 멀티 워커 동시 처리 시 원자적 잡 획득 |
| **Realtime subscription** | `use-video-assembly-job-tracker.ts:120` | postgres_changes로 잡 상태 푸시 |
| **폴백 폴링** | 같은 파일 `:98` | Realtime 실패 시 12s/45s 폴링 |
| **채널별 fan-out** | `studio-buffer.ts:265` | `Promise.all`로 채널 병렬 발행 |
| **멱등성 키** | `studio-buffer.ts` | `SHA1(orgId\|episodeId\|channelId\|scheduledAt)` |

---

## 4. 데이터 모델

> 카운트(마이그레이션 수·테이블 수)는 시점별 스냅샷이며 최신 스키마는 Supabase 및 `pnpm db:types` 출력 기준입니다. MICE-era 테이블은 **`052_drop_mice_legacy_tables.sql`** 로 삭제되었습니다.

### Organization 중심 방사형 구조

```
organizations
  ├─ profiles (id=auth.users.id)
  ├─ organization_invitations
  ├─ organization_content_entitlements
  ├─ audit_logs
  ├─ toss_payment_intents ──→ content_products   [LEGACY DB — no app webhook; optional future drop]
  ├─ lemon_squeezy_processed_orders
  ├─ studio_projects
  ├─ studio_production_episodes  ★ Studio hub
  │     ├─ studio_production_artifacts
  │     ├─ studio_episode_draft_snapshots
  │     ├─ studio_episode_llm_threads
  │     ├─ studio_episode_performance
  │     ├─ studio_video_assembly_jobs
  │     └─ studio_scheduled_posts
  ├─ studio_org_provider_connections
  ├─ studio_youtube_channel_tokens
  └─ studio_distribution_channels
```

**Global 참조**: `studio_niches → studio_format_packs → studio_format_templates`, `content_products`(active=true는 anon 읽기), `waitlist_signups`.

### 인덱스 전략

- `(organization_id)` 단독 — 19개 테이블
- `(organization_id, updated_at desc)` — 최신 정렬 (episodes, projects)
- `(organization_id, created_at desc)` — 시계열 (audit_logs, payments)
- `(created_at asc) where status='pending'` — FIFO 큐 (video_assembly_jobs)
- **Realtime publication** — `studio_video_assembly_jobs` (035, `replica identity full`)

### 트리거 무결성

- Episode: `format_template.niche_id`와 `episode.niche_id` 일치 강제
- Distribution_channel: episode와 organization_id 일치 강제
- Artifacts/jobs: 부모 episode의 organization_id로 자동 덮어씀

---

## 5. 외부 통합 매트릭스

| 프로바이더 | 용도 | 자격증명 | 상태 |
|---|---|---|---|
| **Supabase** | Auth/DB/Storage | env | 가동 |
| **Runway ML** | I2V (veo3.1), T2V 폴백 | org-level (암호화) | 가동, preflight 크레딧 검사 |
| **Google Gemini** | 이미지 생성, LLM 플래닝 | env / org | 가동 |
| **FLUX (Replicate + fal.ai)** | 대체 이미지 생성 | org | 가동 (ADR-009) |
| **Seedream** | 이미지 생성 | org | 가동 |
| **ElevenLabs** | TTS | org | 가동 |
| **YouTube** | OAuth + 업로드 + analytics | env(OAuth) + org(token) | 가동 |
| **Buffer** | 스케줄 발행 (3채널 캡션) | org | 가동 |
| **Lemon Squeezy** | 글로벌 결제 (MoR) | env (ADR-005) | **Primary** (catalog) |
| **Polar** | 블로그 구독 등 | env | **Primary** (subscriptions) |
| **Toss Payments** | (역사) 한국 PoC | — | **Removed from app** — [`ADR-001`](../adr/ADR-001-toss-payments-poc.md) |
| **Resend** | waitlist 트랜잭션 메일 | env | 가동 |
| **PostHog** | 분석 | env | 옵션 |

자격증명 분리 ([ADR-006](../adr/)): 플랫폼 키는 env, **사용자 자체 자격증명**은 `studio_org_provider_*` 테이블에 암호화 저장.

---

## 6. 결제·콘텐츠 카탈로그 흐름

### Lemon Squeezy (글로벌 Primary)

```
Library /[slug]/checkout
  → resolveLemonCheckoutForBillingPage()    [content_product_lemon_links 조회]
  → Lemon Checkout 세션 (custom_data: org_id, product_id, slug)
  → POST /api/webhooks/lemonsqueezy         [HMAC-SHA256 검증]
  → processLemonSqueezyOrderWebhook()
      ├─ allowlist 체크 (CATALOG_CHECKOUT_REQUIRE_ALLOWLIST)
      ├─ INSERT lemon_squeezy_processed_orders (멱등성: ls_order_identifier PK)
      └─ INSERT organization_content_entitlements (org+product UNIQUE)
```

### Legacy: Toss PoC (removed from app)

Toss widget, server actions, and `/api/webhooks/toss` are **not shipped** (2026-05). **`toss_payment_intents`** may still exist in Postgres as a **legacy** table from migration `008`; see [`ADR-005`](../adr/ADR-005-payment-rails-lemon-primary-toss-deferred.md).

### e-book 다운로드

- `delivery_mode = 'pdf'` → `storage_object_path`에서 signed URL 생성
- `delivery_mode = 'web_only'` → in-app reader만 (`/library/[slug]/read`)
- `content_ebook_first_opens` → 환불 컷오프 추적

---

## 7. 인증·권한 모델

### PKCE 안정화

최근 7개 커밋(`ce73b79`, `0fdd01d`, `e82a1ce` 등)이 PKCE 관련. 핵심:

- **PKCE verifier는 hydration 경합에 취약** → Route Handler로 단일화
- **`exchangeCodeForSession()`**은 한 요청 내에서 verifier 소비
- **에러 분류 함수** ([src/lib/auth/pkce-session-recovery.ts](../../src/lib/auth/pkce-session-recovery.ts)):
  - `isPkceVerifierMissingError()` → 강제 로그아웃
  - `shouldAllowPkceErrorSessionRecovery()` → "invalid_grant" 시만 복구

### 대시보드 게이트

- `profiles.dashboard_access` = true 또는 `role = 'admin'`만 접근
- 미승인 → `/access-pending`
- service role로 읽음 (마이그레이션 037)

### RLS 재귀 차단

```sql
create function user_organization_id() returns uuid security definer ...
  select organization_id from profiles where id = auth.uid();

create policy on studio_production_episodes using (organization_id = user_organization_id());
```

004_profiles_rls_no_recursion.sql이 정착시킨 패턴. 이후 모든 Studio 테이블 동일.

### Server Action 권한 헬퍼 ([src/lib/auth/require-org-editor.ts](../../src/lib/auth/))

| 함수 | 허용 역할 | 사용처 |
|---|---|---|
| `getOrgMemberContext()` | viewer 포함 모든 멤버 | 읽기 전용 |
| `getOrgEditorContext()` | admin/organizer/coordinator | 일반 편집 |
| `getOrgAdminContext()` | admin only | 멤버 관리 |
| `getOrgInviteManagerContext()` | admin/organizer | 초대 발송 |

### 두 어드민 분리

- **Org admin** (`profiles.role = 'admin'`): `/dashboard/organization/...`
- **Platform admin** (`PLATFORM_ADMIN_EMAILS` env): `/admin/...`

---

## 8. 개발·운영 컨벤션

- **A-tier 제약 (불변)**: [AGENTS.md](../../AGENTS.md), [CLAUDE.md](../../CLAUDE.md), [.cursor/rules/](../../.cursor/rules/) 18개, pre-commit 훅 (`--no-verify` 금지)
- **B-tier 상태**: [memory-bank/](../../memory-bank/) — `tasks.md`(로드맵 SoT), `activeContext.md`(현재 포커스), `creative-elevate-ai-pivot.md`(North Star)
- **C-tier 워크플로우**: gstack 슬래시 스킬
- **Next.js 16 주의**: 학습 데이터와 다른 API 다수, `node_modules/next/dist/docs/` 우선 참조
- **디자인**: 마케팅(웜 크림+오렌지) vs 앱(블루) 표면 분리 ([VISUAL_LANGUAGE_V2.md](../design/VISUAL_LANGUAGE_V2.md))
- **품질 게이트**: `pnpm verify` (lint + typecheck + test + build)
- **CI**: ci.yml(lint/build/Vitest), e2e.yml(Playwright), fly-video-assembly.yml(워커 배포)
- **GitHub 프로세스**: 이슈 → `issue-N-short-name` 브랜치 → `Closes #N` PR → verify → 머지 ([DEV_PROCESS_GITHUB.md](../DEV_PROCESS_GITHUB.md))

---

## 9. 발견된 리스크 (우선순위순)

### 🔴 높음

1. **마이그레이션 번호 중복**
   - `013_content_ebook_delivery_and_first_open.sql` ↔ `013_waitlist_signups.sql`
   - `014_catalog_purchase_allowlist.sql` ↔ `014_profiles_ui_locale.sql`
   - **영향**: 신규 환경에서 실행 순서 비결정 → 일부 컬럼/테이블 누락 가능. 기존 환경은 이미 적용되어 있음.
   - **권고**: 이미 적용된 환경의 ledger를 확인하고, 미적용 환경에서 안전하게 다음 번호로 rename.

2. **Studio provider enum 드리프트**
   - `studio_org_provider_connections.provider` enum에 anthropic/elevenlabs/image_providers/buffer 미반영.
   - **권고**: enum 추가 마이그레이션 또는 별도 테이블 패턴 공식화.

### 🟡 중간

3. **Runway 크레딧 부족 감지가 메시지 문자열 의존** — API 응답 포맷 변경 시 깨짐.
4. **자동 재시도 부재** — transient 외부 API 오류에 취약.
5. **FFmpeg 워커 stale job 회수 메커니즘 없음** — `processing` 상태로 영구 잔존 가능.
6. **Lemon `lemon_squeezy_processed_orders` UNIQUE 제약 명시 미확인**.

### 🟢 낮음

7. **Artifact metadata 스키마 비일관** — `jsonb` 자유 형식.
8. **Legacy MICE Postgres domain** 제거 후 RLS 패턴 재검증(새 FK 없음 확인).
9. **YouTube 업로드 후 공개/예약 상태 변경 추적 없음**.
10. **Buffer 발행 결과 재확인 없음** (webhook 미사용).

---

## 10. 신규 합류자용 코드 읽기 순서

1. [memory-bank/creative-elevate-ai-pivot.md](../../memory-bank/creative-elevate-ai-pivot.md) — 30분, 제품 비전
2. [memory-bank/tasks.md](../../memory-bank/tasks.md) §Phase 진행 상황 — 15분
3. [src/app/(dashboard)/dashboard/productions/[episodeId]/page.tsx](../../src/app/(dashboard)/dashboard/productions/[episodeId]/page.tsx) — 핵심 사용자 화면
4. [src/actions/studio-productions.ts](../../src/actions/studio-productions.ts) — 에피소드 라이프사이클
5. [scene-llm-planner.ts](../../src/lib/studio-productions/scene-llm-planner.ts) → [scene-images](../../src/actions/studio-scene-images.ts) → [scene-i2v](../../src/actions/studio-scene-i2v.ts) → [video-assembly](../../src/actions/studio-video-assembly.ts) → [workers/video-assembly/run.ts](../../workers/video-assembly/run.ts) — 파이프라인 한 바퀴
6. [supabase/migrations/017_studio_productions.sql](../../supabase/migrations/017_studio_productions.sql) + 023, 034 — Studio 데이터 모델
7. [src/lib/auth/require-org-editor.ts](../../src/lib/auth/) + [supabase/migrations/004_profiles_rls_no_recursion.sql](../../supabase/migrations/004_profiles_rls_no_recursion.sql) — 권한 체계
8. [docs/AI_ORCHESTRATION.md](../AI_ORCHESTRATION.md) + [AGENTS.md](../../AGENTS.md) — 작업 시 따라야 할 규칙
