# Active Context — Elevate

## 현재 페이즈

**AI 피벗 — Phase A/B**  
North Star: [`creative-elevate-ai-pivot.md`](creative-elevate-ai-pivot.md). 문서·랜딩(Pretext)·gstack·신규 DB(콘텐츠 카탈로그·엔타이틀먼트)와 대시보드 Library 우선 네비.

### 최근 출시 (앵커)

**Studio Productions (제작 원장)** — v1 라우트·워크벤치 구현됨: `/dashboard/productions`, `/dashboard/productions/new`, 에피소드 상세. ADR·PLAN은 확장·운영 시 참고.

- ADR: [`docs/adr/ADR-003-studio-productions-mvp.md`](../docs/adr/ADR-003-studio-productions-mvp.md)  
- PLAN·리뷰: [`docs/features/PLAN-studio-productions.md`](../docs/features/PLAN-studio-productions.md) · [`docs/features/GSTACK_REVIEW-production-workbench.md`](../docs/features/GSTACK_REVIEW-production-workbench.md)  

**대시보드 접근 (운영 옵션)** — `DASHBOARD_ACCESS_STRICT=true`일 때 플랫폼/조직 관리자 또는 `waitlist_signups`·`prompt_studio_beta_allowlist`에 없으면 `/access-pending`. 코드: `src/lib/auth/dashboard-access.ts`, `src/app/(auth)/access-pending/page.tsx`.

**다음 (로드맵):** [`tasks.md`](tasks.md) Phase M·백로그 — 블로그 번역 확대, PostHog 대시보드 UI, 전자책 SKU 등.

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
