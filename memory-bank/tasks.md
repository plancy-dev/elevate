# Elevate — Roadmap & Task Tracking (SoT)

**제품**: Elevate — **AI 가이드 → B2B 워크플로/에이전트** 플랫폼 (피벗 진행 중)  
**스택**: Next.js 16 (App Router) · TypeScript · Tailwind v4 · Supabase (Auth + Postgres + RLS) · Vercel  
**원칙**: 멀티테넌트(`organization_id`) + RLS, 서버 컴포넌트 우선. **비전 SoT**: [`creative-elevate-ai-pivot.md`](creative-elevate-ai-pivot.md)

---

## CTO 우선순위 (한 줄)

**Prompt Studio 내러티브·IA → 카탈로그·권한·결제 루프 → 스튜디오 MVP·에이전트 워크스페이스**

랜딩·메타 카피는 **Prompt Studio / 프롬프트 개선 MVP** 우선; 카탈로그·전자책·뉴스레터는 성장·상업 레이어(`docs/CONTENT_FUNNEL.md`).

---

## AI 피벗 — Phase A (문서·랜딩·도구)

| # | 항목 | 상태 |
|---|------|------|
| A0 | Phase 0 인벤토리 + North Star (`inventory-ai-pivot-phase0.md`, `creative-elevate-ai-pivot.md`) | ✅ |
| A1 | README, `domainKnowledge`, `tasks`, `activeContext`, AGENTS/CLAUDE 정렬 | ✅ |
| A2 | gstack 저장소 설치·`CLAUDE.md` 연동 | ✅ (`.agents/skills/gstack` 클론; `./setup`는 **Bun** 필요 — [docs/GSTACK.md](../docs/GSTACK.md)) |
| A3 | `@chenglou/pretext` 랜딩(클라이언트)·i18n | ✅ |
| A4 | AI 문서 통합 — gstack ↔ Memory Bank 허브 [`docs/AI_ORCHESTRATION.md`](../docs/AI_ORCHESTRATION.md), `AI_USAGE`·`GSTACK`·README 정렬 | ✅ |
| A5 | 세션 자동 부트스트랩 [`ai-session-bootstrap.mdc`](../.cursor/rules/ai-session-bootstrap.mdc) · [`AI_USER_TEMPLATES.md`](../docs/AI_USER_TEMPLATES.md) · [`AI_WORKFLOW_PORTABILITY.md`](../docs/AI_WORKFLOW_PORTABILITY.md) | ✅ |
| A6 | 킬링 서비스 중심 랜딩·IA — `en.json`·Product 슬러그·Studio 플레이스홀더·[`ADR-002`](../docs/adr/ADR-002-prompt-studio-mvp.md) | ✅ |

---

## AI 피벗 — Phase B (데이터·앱)

| # | 항목 | 상태 |
|---|------|------|
| B1 | 마이그레이션 `009` — `content_products`, `organization_content_entitlements` + RLS | ✅ |
| B2 | 대시보드 **Library** 우선 네비; MICE는 Legacy 그룹으로 이동 | ✅ |
| B3 | `pnpm db:types` 재생성 | 로컬 Supabase 프로젝트에서 적용 후 실행 |
| B4 | Toss·결제와 `content_products` 정합 (`011` intent link, confirm/webhook → entitlement; Library→Billing `?product=`) | ✅ |
| B5 | `010` `product_kind` + Library 표시 + [`docs/CONTENT_FUNNEL.md`](../docs/CONTENT_FUNNEL.md) | ✅ |

---

## AI 피벗 — Phase C (성장)

| 항목 | 비고 |
|------|------|
| 듀얼 GTM 랜딩/케이스 | Bottom-up + Enterprise 스토리 |
| 크리에이터·마켓플레이스 | 수수료·정산 모델 제품화 |
| 에이전트 워크스페이스 | 노드 UI·연동·감사 |

---

## PLG 검증 — Phase M (블로그·전자책·분석)

상세 페이즈·gstack 역할: [`marketing-content-pipeline.md`](marketing-content-pipeline.md)

| # | 항목 | 상태 |
|---|------|------|
| M0 | PostHog `elevate_blog_post_viewed`; 퍼널 문서 [`CONTENT_FUNNEL.md`](../docs/CONTENT_FUNNEL.md) 정합 | ✅ |
| M1 | Supabase `016` `prompt_studio_beta_allowlist` + `/admin/prompt-studio-allowlist` + `STUDIO_BETA_REQUIRE_ALLOWLIST` | ✅ (마이그레이션 적용·`pnpm db:types`는 연결 프로젝트에서) |
| M2 | 콘텐츠 필라·분기 캘린더 (다국어) — [`marketing-pillars-m2.md`](marketing-pillars-m2.md) (Q2 2026 주차·각도 채움) | ✅ 기획안 |
| M3 | 블로그 단편 글 (필라별, CTA→대기명단) | en+ko 플래그십 `the-prompt-is-your-product-surface` + [`docs/BLOG_POST_PIPELINE.md`](../docs/BLOG_POST_PIPELINE.md); ja/zh/TW 샘플·번역 ⏳ |
| M4 | 전자책 SKU 슬라이스 (카탈로그·MDX·권한 — 기존 파이프라인에 맞춰 분할 출시) | ⏳ |
| M5 | PostHog: [`docs/POSTHOG_FUNNELS.md`](../docs/POSTHOG_FUNNELS.md) 퍼널 레시피 + 프로젝트 UI에서 대시보드 저장 | 레시피 ✅ · UI ⏳ |
| M2.1 | 소셜·Linktree·자사 짧은 링크(`/ig`,`/yt`,`/links` 등) — [`MARKETING_OPS_CHECKLIST.md`](../docs/MARKETING_OPS_CHECKLIST.md) | ✅ 채널 1차·문서 |
| M3.1 | **Studio Productions** — 외부 AI 툴 산출물·프롬프트 원장 (v1: 링크·레이블·선택 숏컷만, API 연동 없음) | ⏳ PLAN 입력 [`docs/features/PLAN-studio-productions.md`](../docs/features/PLAN-studio-productions.md) · ADR [`003`](../docs/adr/ADR-003-studio-productions-mvp.md) · 리뷰 [`GSTACK_REVIEW`](../docs/features/GSTACK_REVIEW-production-workbench.md) § I–K |

**마케팅 실행 순서 (채널 구축 후 → 콘텐츠):** 아래를 위에서부터. 상세·카피는 [`MARKETING_OPS_CHECKLIST.md`](../docs/MARKETING_OPS_CHECKLIST.md) · 필라·캘린더는 [`marketing-pillars-m2.md`](marketing-pillars-m2.md).

1. **측정 열기:** PostHog 대시보드 저장(M5) · GSC 속성·사이트맵(미완 시).
2. **공유 품질:** 루트 `openGraph` 기본 이미지(1200×630) 1장 — [`MARKETING_OPS_CHECKLIST`](../docs/MARKETING_OPS_CHECKLIST.md) B4.
3. **블로그 1편(M3):** [`marketing-pillars-m2.md`](marketing-pillars-m2.md) Q2 표 **W1 각도** → `content/blog/en/` (또는 우선 로케일) MDX · CTA→대기명단.
4. **소셜 리듬:** 주 2~3회 X+Threads(동일 소재·시간错开) · 유튜브는 **첫 영상 1개** 스크립트·썸네일 준비 후 업로드.
5. **바이오 정합:** 인스타/Threads/X/유튜브에 `elevate.ai.kr/ig`·`/links`·`/yt` 등 문서(E1f)와 동일하게 유지.
6. **월 1회:** GSC 검색어 + PostHog 퍼널 A 점검 · 다음 달 필라 믹스 조정.

---

## Legacy — 이전 Phase 요약 (완료, MICE)

> 신규 기능은 MICE 모델에 추가하지 않는다.

- **Phase 0 Foundation**: 스캐폴딩, 마케팅·대시보드, Supabase, `000`–`002`
- **Phase 1 MVP MICE**: 이벤트·venue·세션·참석자 CRUD, 설정, `proxy`
- **Phase 2 Growth**: 팀 초대 `006`, 분석, 감사 `007`, Toss PoC `008`, PostHog

상세 체크리스트는 git 히스토리·`reflect-phase1-closeout.md` 참고.

---

## 백로그 (공통)

| 우선순위 | 항목 | 비고 |
|---------|------|------|
| P1 | **시각 언어 v2** — [`docs/design/VISUAL_LANGUAGE_V2.md`](../docs/design/VISUAL_LANGUAGE_V2.md) 롤아웃 · [`PLAN_VISUAL_LANGUAGE_V2_ROLLOUT.md`](../docs/design/PLAN_VISUAL_LANGUAGE_V2_ROLLOUT.md) | ✅ PR-1–5 + 문서/PR-6(부분) 반영(2026-04); 스테이징 스크린샷·감사 리포트 갱신은 선택 |
| P0 | Production Toss keys·웹훅 URL·상용 컴플라이언스 | 운영 |
| P1 | PostHog 대시보드(퍼널 시각화) | 이벤트: `elevate_funnel_*`, `elevate_waitlist_*`, `elevate_marketing_cta_click`, `elevate_blog_post_viewed` — [`docs/POSTHOG_FUNNELS.md`](../docs/POSTHOG_FUNNELS.md) 참고 후 UI에서 구성 |
| P1 | E2E CI — PR에 `run-e2e` 라벨 또는 수동 workflow | `e2e.yml` |
| P2 | MICE 스키마 제거 또는 아카이브 | 데이터·고객 영향 검토 후 |
| P2 | **롱폼·모바일 타이포 리듬** | ✅ Phase A–C [`docs/features/PLAN-responsive-longform-typography.md`](../docs/features/PLAN-responsive-longform-typography.md) — 배포 후 Lighthouse로 CV·LCP만 점검 |

---

## 메모

- **서비스 롤**: 조직 자동 생성 등 관리 작업에만 사용; 클라이언트 번들 금지.
- **RLS**: `profiles.organization_id`가 없으면 데이터 접근이 막힐 수 있음 → 온보딩 필수.
- **gstack**: YC 관점 리뷰는 `/plan-ceo-review`, `/office-hours` 등 — `CLAUDE.md` 참고. **역할 분담**는 `docs/AI_ORCHESTRATION.md`.
