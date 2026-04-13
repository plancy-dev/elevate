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
| M4 | 전자책 SKU 슬라이스 (카탈로그·MDX·권한 — 기존 파이프라인에 맞춰 분할 출시) | MDX+런북 ✅ · **DB+Lemon 연결은 운영** [`PLAN-g1-first-ebook-sku-runbook.md`](../docs/features/PLAN-g1-first-ebook-sku-runbook.md) |
| M5 | PostHog: [`docs/POSTHOG_FUNNELS.md`](../docs/POSTHOG_FUNNELS.md) 퍼널 레시피 + 프로젝트 UI에서 대시보드 저장 | 레시피 ✅ · **UI 저장 절차** [`POSTHOG_DASHBOARD_FIRST_SAVE.md`](../docs/POSTHOG_DASHBOARD_FIRST_SAVE.md) |
| M2.1 | 소셜·Linktree·자사 짧은 링크(`/ig`,`/yt`,`/links` 등) — [`MARKETING_OPS_CHECKLIST.md`](../docs/MARKETING_OPS_CHECKLIST.md) | ✅ 채널 1차·문서 |
| M3.1 | **Studio Productions** — 외부 AI 툴 산출물·프롬프트 원장 (v1: 링크·레이블·선택 숏컷만, API 연동 없음) | ✅ v1 앱 경로·워크벤치; 확장은 [`PLAN-studio-productions.md`](../docs/features/PLAN-studio-productions.md) · ADR [`003`](../docs/adr/ADR-003-studio-productions-mvp.md) |

**마케팅 실행 순서 (채널 구축 후 → 콘텐츠):** 아래를 위에서부터. 상세·카피는 [`MARKETING_OPS_CHECKLIST.md`](../docs/MARKETING_OPS_CHECKLIST.md) · 필라·캘린더는 [`marketing-pillars-m2.md`](marketing-pillars-m2.md).

1. **측정 열기:** PostHog 대시보드 저장(M5) · GSC 속성·사이트맵(미완 시).
2. **공유 품질:** 루트 `openGraph` 기본 이미지(1200×630) 1장 — [`MARKETING_OPS_CHECKLIST`](../docs/MARKETING_OPS_CHECKLIST.md) B4.
3. **블로그 1편(M3):** [`marketing-pillars-m2.md`](marketing-pillars-m2.md) Q2 표 **W1 각도** → `content/blog/en/` (또는 우선 로케일) MDX · CTA→대기명단.
4. **소셜 리듬:** 주 2~3회 X+Threads(동일 소재·시간错开) · 유튜브는 **첫 영상 1개** 스크립트·썸네일 준비 후 업로드.
5. **바이오 정합:** 인스타/Threads/X/유튜브에 `elevate.ai.kr/ig`·`/links`·`/yt` 등 문서(E1f)와 동일하게 유지.
6. **월 1회:** GSC 검색어 + PostHog 퍼널 A 점검 · 다음 달 필라 믹스 조정.

---

## Creator GTM — Phase G (전자책 1 SKU + Productions + 글로벌 결제)

**의사결정 요약 (2026-04):** 1차로 **전자책(또는 가이드) 1개 SKU**로 노하우를 팔고, **Studio Productions**로 숏폼·툴 실험·산출물을 **원장**처럼 정리한다. **글로벌 결제**는 기존 Toss(KR PoC)와 별도로 **Lemon Squeezy** 등 글로벌 Merchant of Record 후보를 검토·연동한다. 상세 퍼널·채널은 [`CONTENT_FUNNEL.md`](../docs/CONTENT_FUNNEL.md) · [`MARKETING_OPS_CHECKLIST.md`](../docs/MARKETING_OPS_CHECKLIST.md) · [`marketing-pillars-m2.md`](marketing-pillars-m2.md).

| 단계 | 이름 | 목표 |
|------|------|------|
| **G0** | 범위·결제 전략 | 무엇을 파는지·어디에 결제를 걸지 확정 |
| **G1** | 상품·콘텐츠 1 SKU | 카탈로그·MDX·Library에서 구매·읽기 가능 |
| **G2** | 글로벌 결제 연동 | Lemon Squeezy(또는 동급) 웹훅 → 엔타이틀먼트 |
| **G3** | Productions 루틴 | 실험 기록 습관화(전자책 2판 재료) |
| **G4** | 숏폼 2주 스프린트 | 채널·업로드·CTA 최소 검증 |
| **G5** | 측정·회고 | PostHog·구매 전환·다음 스프린트 |

### G0 — 범위·결제 전략 (½~1일)

- [x] **전자책 1편** 주제·약속 한 줄·시작 로케일 — [`docs/features/PLAN-g0-creator-commerce-decisions.md`](../docs/features/PLAN-g0-creator-commerce-decisions.md) (플레이북 제목·약속·**en 우선**)
- [x] **Lemon vs Toss** — [`docs/adr/ADR-005-payment-rails-lemon-primary-toss-deferred.md`](../docs/adr/ADR-005-payment-rails-lemon-primary-toss-deferred.md): **Lemon 우선**, Toss 신규 카탈로그는 **당분간 보류** (사용자 결정 반영)
- [x] 가격·통화·환불·세금(MoR) 초안 — 동일 G0 문서 §2 (USD 리스트·Lemon MoR·환불은 약관·후속 자동화와 정합)

### G1 — 상품·콘텐츠 (M4 슬라이스와 동일 선상)

- [ ] `content_products`에 **ebook/guide SKU 1개** — Supabase에 행 삽입·Lemon 변형 연결은 운영자가 수행: [`docs/features/PLAN-g1-first-ebook-sku-runbook.md`](../docs/features/PLAN-g1-first-ebook-sku-runbook.md) (슬러그 `prompt-surface-playbook`)
- [x] 본문 **MDX** (`web_only`) — [`content/ebooks/prompt-surface-playbook/index.mdx`](../content/ebooks/prompt-surface-playbook/index.mdx); 엔타이틀먼트·[`ebook-access`](../src/lib/content/ebook-access.ts)는 기존 코드 경로와 정합
- [ ] 랜딩/블로그 **CTA 1개** — 대기명단 또는 바로 결제(결제 수단 준비 후)

### G2 — 글로벌 결제 (Lemon Squeezy)

- [ ] LS(또는 대안) **상품·웹훅 URL·시크릿** · 테스트 모드
- [ ] 앱: **웹훅 수신** → `organization_content_entitlements`(또는 동일 패턴) **grant** — Toss confirm과 **공통 엔타이틀먼트 레이어** 재사용 여부 설계
- [ ] 프로덕션 전 **구매→라이브러리 열람** E2E 또는 수동 시나리오
- [ ] 백로그 정리: P0 “Toss 상용”과 **역할 분담**(KR vs 글로벌)

### G3 — Productions 운영 루틴 (도구: 이미 v1 있음)

- [ ] 에피소드 **네이밍 규칙**(예: 플랫폼·실험 번호)
- [ ] **아티팩트**에 프롬프트·공개 URL·메타데이터 습관화 — [ADR-003 Studio Productions](../docs/adr/ADR-003-studio-productions-mvp.md)
- [ ] (선택) Prompt Studio → Productions **핸드오프** 이미 있음 — 실제로 한 사이클 돌려보기

### G3.1 — Productions **P0** (레저·숏 워크플로 정착) — 구현 체크리스트

> **목표:** 수동(Runway·챗봇)이어도 **한 숏 = 한 에피소드**에 스크립트·프롬프트·설정·출력·(선택) 정책 메모가 **끊기지 않게** 담는다.  
> **비목표:** Runway OAuth/API 연동(ADR-003 v1 밖) — [`docs/adr/ADR-003-studio-productions-mvp.md`](../docs/adr/ADR-003-studio-productions-mvp.md).  
> **런북(참고):** [`docs/RUNWAY_SHORTS_RUNBOOK.md`](../docs/RUNWAY_SHORTS_RUNBOOK.md) · Step2·JSON: [`docs/RUNWAY_SCENE_BUILDER_STEP2.md`](../docs/RUNWAY_SCENE_BUILDER_STEP2.md).

#### P0-1 — `artifact_role` · 라벨 규칙 팀 내 고정

- [x] **권장 역할 이름**을 문서·코드로 고정: [`docs/STUDIO_ARTIFACT_ROLES.md`](../docs/STUDIO_ARTIFACT_ROLES.md) · [`src/lib/studio-productions/artifact-roles.ts`](../src/lib/studio-productions/artifact-roles.ts) (`STUDIO_SUGGESTED_ARTIFACT_ROLES`)  
- [ ] **에피소드당 최소 습관:** 스크립트(또는 훅 문장) 1 · 컷별 `prompt` 또는 `settings`(JSON) · 공개 URL(`render_output` 또는 `external_url`) 1 — **팀 운영** (앱 강제 아님)  
- [x] **위치:** 워크벤치 UI — `Dashboard.productions` i18n · 역할 입력 `<datalist>` · `artifactRoleHint` (en/ko/ja/zh)

#### P0-2 — 에피소드 상세에서 **컷 순서**가 보이게

- [x] 아티팩트 목록에 **스토리 순서** 배지(1, 2, 3…) + 부제·도움말에 순서 설명; 편집 다이얼로그에서 **`sort_order`** 변경 가능  
- [x] **위치:** [`src/components/dashboard/studio-productions-forms.tsx`](../src/components/dashboard/studio-productions-forms.tsx) · [`src/actions/studio-productions.ts`](../src/actions/studio-productions.ts) (`updateStudioArtifact` + `studioInvalidSortOrder`)

#### P0-3 — (선택) 제작 도움말에 **내부 런북 링크** 1줄

- [x] 팀·운영자: 저장소 내 경로 안내 (`docs/RUNWAY_SHORTS_RUNBOOK.md`, `docs/RUNWAY_SCENE_BUILDER_STEP2.md`) — 공개 Notion URL은 필요 시 `NEXT_PUBLIC_*` 등으로 별도 추가 가능  
- [x] **위치:** `Dashboard.productions.helpRunbook` — 에피소드 상세 도움말 블록 두 번째 문단 (`/dashboard/productions/[episodeId]`)

#### 의사결정 가이드 (이 블록만 읽어도 됨)

| 질문 | 권장 |
|------|------|
| 지금 **Runway를 매일** 돌려야 하나? | **아니오.** P0는 **앱에 기록 구조를 굳히는 것**이 우선. Runway는 샘플·채널용 **배치**로 충분. |
| **G2 Lemon**과 동시에 할까? | **병행 가능:** G2는 결제·웹훅, G3.1은 제작 UX — 사람 다르면 나눠도 됨. **한 사람**이면 G2 먼저 또는 G3.1 먼저 **한 줄로** 정하기. |
| `compliance_note`를 지금 필수로? | **선택.** 유튜브 제재 대비가 목표면 **에피소드 `notes` 또는 아티팩트 1개**로 시작. |
| DB 마이그레이션 필요? | P0는 **기존 `artifact_role` 텍스트 + `metadata` jsonb**로 대부분 가능. 스키마 변경은 **P1**에서 검토. |

### G4 — 숏폼 2주 스프린트 (초미니 체크리스트)

**전제:** 조회·바이럴은 플랫폼 측; Elevate는 **기록·상품·결제** 측.

| | Week 1 | Week 2 |
|---|--------|--------|
| 채널 | Shorts **또는** Reels **또는** TikTok **1개만** 고정 | 동일 채널 유지 |
| 업로드 | **최소 3회**(짧게라도) | **최소 3회** |
| Productions | 업로드·프롬프트·툴 링크 **에피소드/아티팩트로 기록** | 동일 + 1회 **회고 메모** 에피소드 |
| CTA | 바이오·고정댓 **한 URL**만 (`/links`·랜딩·스토어) | 동일 |
| 시간 | 총 **2~3시간** 블록 캘린더에 박기 | 주말에 2주차 편집·정리 |

- [ ] Week 1 종료 시: “계속할 채널” vs “채널 변경” 15분 결정
- [ ] Week 2 종료 시: 전자책 **개정 후보 3줄**만 적기(다음 인쇄/버전용)

### G5 — 측정·회고

- [ ] PostHog: [`POSTHOG_FUNNELS.md`](../docs/POSTHOG_FUNNELS.md) 중 **최소 1개 퍼널** 저장(가능 시)
- [ ] Library 구매(또는 대기명단) **전환 1건이라도** 추적 가능한지 확인
- [ ] gstack: 회고는 **`/retro`** 또는 팀 룰에 맞게 30분

**gstack 파이프라인 (참고):** 스코프·서사 **`/office-hours`** · **`/plan-ceo-review`** → 실행 **`/plan-eng-review`**(결제·웹훅·RLS) → 빌드 후 **`pnpm verify`** → 런칭 후 **`/design-review`**(랜딩·Library) · 선택 **`/qa`**. 허브: [`docs/AI_ORCHESTRATION.md`](../docs/AI_ORCHESTRATION.md).

---

## Legacy — 이전 Phase 요약 (완료, MICE)

> 신규 기능은 MICE 모델에 추가하지 않는다.

- **Phase 0 Foundation**: 스캐폴딩, 마케팅·대시보드, Supabase, `000`–`002`
- **Phase 1 MVP MICE**: 이벤트·venue·세션·참석자 CRUD, 설정, `proxy`
- **Phase 2 Growth**: 팀 초대 `006`, 분석, 감사 `007`, Toss PoC `008`, PostHog

상세 체크리스트는 git 히스토리·[`archive/work-history/reflect-phase1-closeout.md`](archive/work-history/reflect-phase1-closeout.md) 참고.

---

## 백로그 (공통)

| 우선순위 | 항목 | 비고 |
|---------|------|------|
| P0 | Production Toss keys·웹훅 URL·상용 컴플라이언스 | 운영 |
| P1 | **글로벌 결제(MoR)** — Lemon Squeezy(또는 동급) 웹훅 → `content` 엔타이틀먼트 · Toss와 역할 분리 | Phase G2 · ADR·[`CONTENT_FUNNEL.md`](../docs/CONTENT_FUNNEL.md) |
| P1 | **시각 언어 v2** — [`docs/design/VISUAL_LANGUAGE_V2.md`](../docs/design/VISUAL_LANGUAGE_V2.md) 롤아웃 · [`PLAN_VISUAL_LANGUAGE_V2_ROLLOUT.md`](../docs/design/PLAN_VISUAL_LANGUAGE_V2_ROLLOUT.md) | ✅ PR-1–5 + 문서/PR-6(부분) 반영(2026-04); 스테이징 스크린샷·감사 리포트 갱신은 선택 |
| P1 | **대시보드 단일 표면 UX** — [`docs/design/DASHBOARD_UX_PRINCIPLES.md`](../docs/design/DASHBOARD_UX_PRINCIPLES.md) | ✅ 개요·라이브러리·설정·스튜디오·프로덕션 목록 등(2026-04); 팀·빌링 등은 동일 패턴으로 확장 가능 |
| P1 | PostHog 대시보드(퍼널 시각화) | 이벤트: `elevate_funnel_*`, `elevate_waitlist_*`, `elevate_marketing_cta_click`, `elevate_blog_post_viewed` — [`docs/POSTHOG_FUNNELS.md`](../docs/POSTHOG_FUNNELS.md) 참고 후 UI에서 구성 |
| P1 | E2E CI — PR에 `run-e2e` 라벨 또는 수동 workflow | `e2e.yml` |
| P2 | **대시보드 접근 게이트 (운영)** — `DASHBOARD_ACCESS_STRICT` · [`src/lib/auth/dashboard-access.ts`](../src/lib/auth/dashboard-access.ts) · `/access-pending` | ✅ 코드 반영; 프로덕션 켤 때 Vercel에 `SUPABASE_SERVICE_ROLE_KEY` + 플래그 |
| P2 | MICE 스키마 제거 또는 아카이브 | 데이터·고객 영향 검토 후 |
| P2 | **롱폼·모바일 타이포 리듬** | ✅ Phase A–C [`docs/features/PLAN-responsive-longform-typography.md`](../docs/features/PLAN-responsive-longform-typography.md) — 배포 후 Lighthouse로 CV·LCP만 점검 |

---

## 메모

- **서비스 롤**: 조직 자동 생성 등 관리 작업에만 사용; 클라이언트 번들 금지.
- **RLS**: `profiles.organization_id`가 없으면 데이터 접근이 막힐 수 있음 → 온보딩 필수.
- **gstack**: YC 관점 리뷰는 `/plan-ceo-review`, `/office-hours` 등 — `CLAUDE.md` 참고. **역할 분담**는 `docs/AI_ORCHESTRATION.md`.
