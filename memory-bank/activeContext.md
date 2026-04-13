# Active Context — Elevate

## 현재 페이즈

**AI 피벗 — Phase A/B**  
North Star: [`creative-elevate-ai-pivot.md`](creative-elevate-ai-pivot.md). 문서·랜딩(Pretext)·gstack·신규 DB(콘텐츠 카탈로그·엔타이틀먼트)와 대시보드 Library 우선 네비.

### 최근 출시 (앵커)

**Library · Billing · Lemon (2026-04)** — 제목 상세·체크아웃 진입, 구매 기록, 빌링 중복 카드 제거 및 사용자용 i18n 정리. 아카이브: [`archive/work-history/archive-dashboard-billing-library-lemon-2026-04.md`](archive/work-history/archive-dashboard-billing-library-lemon-2026-04.md).

**Studio Productions (제작 원장)** — v1 라우트·워크벤치 구현됨: `/dashboard/productions`, `/dashboard/productions/new`, 에피소드 상세. ADR·PLAN은 확장·운영 시 참고.

- ADR: [`docs/adr/ADR-003-studio-productions-mvp.md`](../docs/adr/ADR-003-studio-productions-mvp.md)  
- PLAN·리뷰: [`docs/features/PLAN-studio-productions.md`](../docs/features/PLAN-studio-productions.md) · [`docs/features/GSTACK_REVIEW-production-workbench.md`](../docs/features/GSTACK_REVIEW-production-workbench.md)  

**대시보드 접근 (운영 옵션)** — `DASHBOARD_ACCESS_STRICT=true`일 때 플랫폼/조직 관리자 또는 `waitlist_signups`·`prompt_studio_beta_allowlist`에 없으면 `/access-pending`. 코드: `src/lib/auth/dashboard-access.ts`, `src/app/(auth)/access-pending/page.tsx`.

**다음 (로드맵):** [`tasks.md`](tasks.md) — **Phase G (Creator GTM)** 전자책 1 SKU + Productions 루틴 + Lemon Squeezy 등 글로벌 결제 · Phase M·백로그(블로그·PostHog·전자책 M4) 병행.

### 다음 BUILD 앵커 (구현 예정)

**결정된 다음 작업:** **Phase G2 — Lemon Squeezy 웹훅 → 콘텐츠 엔타이틀먼트** (글로벌 결제 루프). 선행: **G0**를 짧은 **ADR 또는 `docs/features/PLAN-*.md`**로 고정(Toss vs LS 역할, SKU 매핑 규칙). 참조 구현: [`src/app/api/webhooks/toss/route.ts`](../src/app/api/webhooks/toss/route.ts), [`src/lib/payments/content-entitlement.ts`](../src/lib/payments/content-entitlement.ts). 병행 가능: **G1** 전자책 SKU 1개(카탈로그·MDX)는 콘텐츠 준비되면 같은 스프린트에 묶기.

**병행 후보 (숏·제작 레저 P0):** [`tasks.md`](tasks.md) **§ G3.1 — Productions P0** — **P0-1·P0-2·P0-3 구현됨 (2026-04):** 권장 역할·`<datalist>`·순서 배지·`sort_order` 편집·에피소드 도움말에 런북 경로 안내 — [`docs/STUDIO_ARTIFACT_ROLES.md`](../docs/STUDIO_ARTIFACT_ROLES.md). **남음:** 팀 습관 체크리스트(P0-1 미체크 항목).

**INIT → 다음:** L3 → **PLAN**(웹훅 보안·idempotency·테스트) 권장 후 **BUILD**.

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
