# Active Context — Elevate

## 현재 페이즈

**AI Content Factory — Phase S (YouTube 콘텐츠 파이프라인)**  
North Star: [`creative-elevate-ai-pivot.md`](creative-elevate-ai-pivot.md). 기존 Studio Productions 원장 + Runway 연동을 확장하여 **스크립트 → TTS → 영상 → 조립 → YouTube 업로드** 파이프라인 구축. 상세: [`PLAN-studio-content-factory.md`](../docs/features/PLAN-studio-content-factory.md) · [`ADR-007`](../docs/adr/ADR-007-youtube-content-factory.md).

### 최근 출시 (앵커)

**Library · Billing · Lemon (2026-04)** — 제목 상세·체크아웃 진입, 구매 기록, 빌링 중복 카드 제거 및 사용자용 i18n 정리. 아카이브: [`archive/work-history/archive-dashboard-billing-library-lemon-2026-04.md`](archive/work-history/archive-dashboard-billing-library-lemon-2026-04.md).

**Studio Productions (제작 원장)** — v1 라우트·워크벤치 구현됨: `/dashboard/productions`, `/dashboard/productions/new`, 에피소드 상세. ADR·PLAN은 확장·운영 시 참고.

- ADR: [`docs/adr/ADR-003-studio-productions-mvp.md`](../docs/adr/ADR-003-studio-productions-mvp.md)  
- PLAN·리뷰: [`docs/features/PLAN-studio-productions.md`](../docs/features/PLAN-studio-productions.md) · [`docs/features/GSTACK_REVIEW-production-workbench.md`](../docs/features/GSTACK_REVIEW-production-workbench.md)  
- **v2 연동(스캐폴딩):** [`docs/adr/ADR-006-studio-provider-integrations-v2.md`](../docs/adr/ADR-006-studio-provider-integrations-v2.md) · [`docs/features/PLAN-studio-provider-integrations.md`](../docs/features/PLAN-studio-provider-integrations.md) · 라우트 `/dashboard/productions/integrations` · `src/lib/studio-integrations/` — 플래그 꺼짐 시에도 문서·상태 표시만.

**대시보드 접근 (운영 옵션)** — `DASHBOARD_ACCESS_STRICT=true`일 때 플랫폼/조직 관리자 또는 `waitlist_signups`·`prompt_studio_beta_allowlist`에 없으면 `/access-pending`. 코드: `src/lib/auth/dashboard-access.ts`, `src/app/(auth)/access-pending/page.tsx`.

**다음 (로드맵):** [`tasks.md`](tasks.md) — **Phase S (Content Factory)** S1: TTS+자막 → S2: 씬+Runway → S3: FFmpeg 조립 → S4: YouTube 업로드 → S5: 분석. 병행: Phase G (Creator GTM) · Phase M (마케팅).

**INIT (2026-04) — 초안 템플릿·바이어스:** [`tasks.md`](tasks.md) **§ G3.4**. **P1+P2:** 시딩 키 + **조직 커스텀**(`029` `studio_episode_draft_templates`, `custom:<uuid>` · 관리 다이얼로그). **다음:** P3 시스템 프롬프트 변형 등은 우선순위에 따라.

### 다음 BUILD 앵커 (구현 예정)

**멀티채널 AI 콘텐츠 팩토리 (Phase T, 2026-04):** 플랜: [`.cursor/plans/elevate_content_factory_roadmap_*.plan.md`]

| Phase | 상태 | 내용 |
|-------|------|------|
| **T1** | **구현됨** | Project(Brand) 계층 — `033_studio_projects.sql`, data/actions/UI, `buildDraftPrompt` brandGuide RAG |
| **T2** | **구현됨** | 레퍼런스 소스 파이프라인 — YouTube STT(yt-dlp+Whisper), LLM 번역/요약/리믹스 (7개 모드), 책 리뷰, 복수 소스 합성 |
| **T3** | **구현됨** | 영상 편집 프리셋 — FFmpeg 필터 시스템 (제목 오버레이, 자막 스타일, 워터마크), 3개 기본 프리셋 |
| **T4** | **구현됨** | 콘텐츠 팩토리 프리셋 — 6개 프리셋 (강연번역, 책리뷰 숏/롱, 뉴스요약, 스토리텔링, 리믹스) |
| **T5** | 백로그 | 옴니채널 (Instagram/TikTok) + 크로스 채널 분석 + AI 추천 |

**Content Factory Phase S (기존):** S1-S5 파이프라인 코드는 이미 구현됨 (Phase S와 Phase T는 동일 코드 기반 확장)

**상업·운영 병행:** **Phase G2 — Lemon Squeezy 웹훅 → 콘텐츠 엔타이틀먼트**. **G0:** [`PLAN-g0-creator-commerce-decisions.md`](../docs/features/PLAN-g0-creator-commerce-decisions.md) · [`ADR-005`](../docs/adr/ADR-005-payment-rails-lemon-primary-toss-deferred.md). **G1/M4:** [`PLAN-g1-first-ebook-sku-runbook.md`](../docs/features/PLAN-g1-first-ebook-sku-runbook.md). **M5:** [`POSTHOG_DASHBOARD_FIRST_SAVE.md`](../docs/POSTHOG_DASHBOARD_FIRST_SAVE.md). 참조: [`src/lib/payments/content-entitlement.ts`](../src/lib/payments/content-entitlement.ts).

**Productions P0:** [`tasks.md`](tasks.md) **§ G3.1** — P0-1·P0-2·P0-3 구현됨; 남은 것은 팀 습관 체크리스트.

**INIT → 다음:** Studio 스프린트면 **PLAN**(Runway 잡·ToS·멱등) 후 **BUILD**; 결제 스프린트면 G2 **PLAN** 후 **BUILD**.

**INIT (2026-04) — Studio AI 콘텐츠 OS 보완:** SoT: [`tasks.md`](tasks.md) **§ G3.3**. **완료:** Anthropic 연동 + Runway **스텁** (`healthCheck` + `runStep` → `not_implemented`). **다음:** 위 Studio 우선순위 + 매트릭스 문서로 API/구현 상태 고정.

### 의사결정 (Productions P0 vs 결제)

| 상황 | 추천 |
|------|------|
| 수익·글로벌 결제가 급함 | **G2 우선**, G3.1은 다음 스프린트 |
| 숏·도구 실험 기록이 제품 스토리의 중심 | **G3.1 먼저** 0.5~1스프린트, G2는 병행 또는 직후 |
| 한 명만 개발 | **한 줄로만** 정함: “이번 주는 G2” 또는 “이번 주는 G3.1” |

## 최근 확정 결정

| 주제 | 결정 |
|------|------|
| 제품 방향 | AI 가이드·워크플로 플랫폼으로 피벗; MICE는 레거시 보관 |
| MICE 스키마 | 당분간 삭제 마이그레이션 없음 |
| SoT 문서 | `creative-elevate-ai-pivot.md` + `tasks.md` |
| **시각 언어 v2 + 대시보드 UX** | [`docs/design/VISUAL_LANGUAGE_V2.md`](../docs/design/VISUAL_LANGUAGE_V2.md) · [`docs/design/DASHBOARD_UX_PRINCIPLES.md`](../docs/design/DASHBOARD_UX_PRINCIPLES.md) — 마케팅/앱 악센트 분리, 리스트는 단일 컨테이너+구분선. 요약: [`creative-apple-tier-visual-system.md`](creative-apple-tier-visual-system.md) · 롤아웃: [`PLAN_VISUAL_LANGUAGE_V2_ROLLOUT.md`](../docs/design/PLAN_VISUAL_LANGUAGE_V2_ROLLOUT.md) |

## 레거시 (MICE) 앵커

| 영역 | 위치 |
|------|------|
| 이벤트·세션·참석자 (레거시) | 스키마·액션 일부 유지; 여러 `/dashboard/events|venues|…` URL은 **`/dashboard`로 리다이렉트** (`next.config.ts`) |
| DB 타입 | `src/types/database.types.ts` (`pnpm db:types`) |
| 요청 경계 | `src/proxy.ts` |

## 신규 (피벗)

| 영역 | 위치 |
|------|------|
| Library | `src/app/(dashboard)/dashboard/library` |
| 콘텐츠 스키마 | `009`–`010` 카탈로그·엔타이틀먼트·`product_kind`; `011` 결제 intent↔SKU; `012` Storage 경로 |
| 결제→권한 | Toss confirm/webhook → `organization_content_entitlements`; Library→Billing `?product=` |
| 전자책 퍼널 문서 | `docs/CONTENT_FUNNEL.md` |
| REFLECT 검수 | [`archive/work-history/reflect-ebook-content-funnel.md`](archive/work-history/reflect-ebook-content-funnel.md) |
| 랜딩 Pretext | `src/components/marketing/pretext-hero-statement.tsx` |
| PLG·블로그·전자책 로드맵 | [`marketing-content-pipeline.md`](marketing-content-pipeline.md) · [`marketing-pillars-m2.md`](marketing-pillars-m2.md) · `tasks.md` Phase M |
| PostHog 퍼널 레시피 | [`docs/POSTHOG_FUNNELS.md`](../docs/POSTHOG_FUNNELS.md) — 저장 인사이트 이름·UI 체크리스트 포함; 대시보드는 PostHog 프로젝트에서 수동 저장 |
| M2 캘린더 | [`marketing-pillars-m2.md`](marketing-pillars-m2.md) § Q2 2026 — M3 MDX로 승격 시 front matter 일정 확정 |
| Prompt Studio 베타 허용 | 마이그레이션 `016` `prompt_studio_beta_allowlist` · `/admin/prompt-studio-allowlist` · env `STUDIO_BETA_REQUIRE_ALLOWLIST` (스튜디오 라우트); **대시보드 전체 게이트**는 별도로 `DASHBOARD_ACCESS_STRICT` + [`dashboard-access.ts`](../src/lib/auth/dashboard-access.ts) |
| 블로그 조회 이벤트 | PostHog `elevate_blog_post_viewed` — `src/components/blog/blog-post-viewed-capture.tsx` |
| **M3 (en+ko 플래그십)** | 슬러그 `the-prompt-is-your-product-surface` — [`en`](../content/blog/en/the-prompt-is-your-product-surface.mdx) · [`ko`](../content/blog/ko/the-prompt-is-your-product-surface.mdx) · 파이프라인 [`docs/BLOG_POST_PIPELINE.md`](../docs/BLOG_POST_PIPELINE.md) · ja/zh는 샘플 유지 → 번역 시 결정 |

## AI / Cursor

- **`memory-bank/tasks.md`** — 단일 우선순위
- **`docs/AI_ORCHESTRATION.md`** — gstack·Memory Bank·저장소 규칙 레이어 (허브)
- **`.cursor/rules/ai-session-bootstrap.mdc`** — 구현·버그·기능 시 `tasks`/`activeContext` 자동 로드
- **`docs/AI_USER_TEMPLATES.md`** · **`docs/AI_WORKFLOW_PORTABILITY.md`** — 요청 형식·타 레포 이식
- **`CLAUDE.md`** — gstack 스킬·브라우징; `docs/GSTACK.md` 설치
