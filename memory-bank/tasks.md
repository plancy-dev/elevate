# Elevate — Roadmap & Task Tracking (SoT)

**제품**: Elevate — **AI 가이드 → B2B 워크플로/에이전트** 플랫폼 (피벗 진행 중)  
**스택**: Next.js 16 (App Router) · TypeScript · Tailwind v4 · Supabase (Auth + Postgres + RLS) · Vercel  
**원칙**: 멀티테넌트(`organization_id`) + RLS, 서버 컴포넌트 우선. **비전 SoT**: [`creative-elevate-ai-pivot.md`](creative-elevate-ai-pivot.md)

---

## CTO 우선순위 (한 줄)

**Prompt Studio 내러티브·IA → 카탈로그·권한·결제 루프 → 스튜디오 MVP·에이전트 워크스페이스**

랜딩·메타 카피는 **Prompt Studio / 프롬프트 개선 MVP** 우선; 카탈로그·전자책·뉴스레터는 성장·상업 레이어(`docs/CONTENT_FUNNEL.md`).

---

## Design System v3 — "Editor's Desk" (편집자의 책상) — INIT 활성

**브랜치:** `feat/editors-desk-v3` · **SoT:** [`INIT`](../docs/features/INIT-editors-desk-design-system.md) · [`ADR-011`](../docs/adr/ADR-011-design-system-v3-editors-desk.md) (Accepted) · [`PLAN S0-S2`](../docs/features/PLAN-editors-desk-s0-s1-s2.md) · [`TOC IA`](../docs/design/v3-creative/toc-ia-mapping.md). **복잡도 L4**. **스키마/서버 액션/마이그레이션 변경 없음** — 표현 계층(토큰·프리미티브·쉘·라우트) 전면 재작성.

**철학.** 하나의 무드(조용·정확·자신감). 색은 **3계열** (`ink` + `paper` + **`vermilion-600` 유일 크로매틱**). 타이포 **Fraunces** (가변 세리프, opsz 9-144) + **Geist** + **JetBrains Mono**. **라운드·섀도우·그라디언트 전면 금지** — 분리는 1px `--ink-100` 룰로만. 시그니처 = **Columnar Timeline** (수직 280px 단 + 1px 세로 룰, 필름스트립 대체 금지). 키보드 퍼스트 (`Cmd+K` 바닥 시트, `g→*` 제스처).

**Q1-Q10 락 완료** ([INIT § 11](../docs/features/INIT-editors-desk-design-system.md) 참조).

### D1 — 이전 시도 메모 (2026-04-24)

작업이 한 차례 진행되었으나 main에 머지되지 않고 사라짐. ADR-010 번호는 별도 주제(`ADR-010-fullscreen-timeline-editor`, Studio Phase 2)에 재배정됨. 본 재시작은 **ADR-011** 사용 + 별도 브랜치 `feat/editors-desk-v3`로 작업 보존.

### D2 — 슬라이스 (1 commit/슬라이스, 전체 1 PR)

| # | 슬라이스 | 복잡도 | 상태 | 주요 산출물 |
|---|---------|-------|------|-----------|
| **S0** | Tokens & Fonts + Archive | L2 | **완료 (2026-04-27)** | `tokens.css` · `globals.css` 재작성(v2 shim) · `layout.tsx` 폰트 · ESLint guard · v2 7건 archive |
| **S1** | Primitives | L3 | **완료 (2026-04-27)** | `desk/{Plate,Mark,ShortcutBadge,Modal,index}` + `ui/*` 10개 재작성 + `design-system-classes.ts` 삭제 |
| **S2** | Shell | L3 | **완료 (2026-04-27)** | `desk/{TOC,Masthead,CommandBar}` + `useShortcut` 훅 + sidebar 삭제 |
| **S3** | **Columnar Timeline (시그니처)** | L3 | **완료 (2026-04-27)** | `desk/ColumnTimeline/{Column,Playhead,Rule}` + Phase 2 editor 통합 + column mapping unit test |
| **S4** | Scene/Publish + Phase 2 sweep | L3 | **완료 (2026-04-27)** | Scene/Publish 표면 + episode shell + `dashboard/editor/*` 클래스명 v3 sweep |
| **S5** | Marketing + Auth | L3 | **완료 (2026-04-28)** | `[locale]/(marketing)/*` + `components/marketing/*` + `components/layout/{header,footer,nav,theme,logo}` + `(auth)/*` + `auth/*` v3 sweep |
| **S6** | Admin + Billing + Lock | L2 | **완료 (2026-04-28)** | admin/billing 표면 정렬 + legacy class wipe + `globals.css` v2 shim 제거 |
| **S7** | Dark (선택) | L2 | **완료 (2026-04-28)** | dark 토글/시스템 모드와 v3 토큰 동기화 (`.dark` + `[data-theme="dark"]`) |

**Merge order:** S0 → S1 → S2 → S3 (시그니처 우선 락) → S4 · S5 · S6 (병렬 가능) → S7.

### D3 — 진행 체크

- [x] **INIT (2026-04-27 재시작):** [`INIT-editors-desk-design-system.md`](../docs/features/INIT-editors-desk-design-system.md) · L4 · 슬라이스 S0-S7 · Q1-Q10 · 04-24 학습 L1-L5
- [x] **ADR-011 (2026-04-27, Accepted):** [`ADR-011`](../docs/adr/ADR-011-design-system-v3-editors-desk.md) · 010→011 번호 이동 메모 + Studio Phase 2 통합 정책
- [x] **CREATIVE S2.0:** TOC IA Option A 락 — [`toc-ia-mapping.md`](../docs/design/v3-creative/toc-ia-mapping.md)
- [x] **PLAN S0/S1/S2:** [`PLAN-editors-desk-s0-s1-s2.md`](../docs/features/PLAN-editors-desk-s0-s1-s2.md) · 슬라이스별 BUILD-ready 체크리스트
- [x] **브랜치:** `feat/editors-desk-v3` 생성 (main 기준)
- [x] **BUILD S0:** v2 7건 archive · `tokens.css` 신규 · `globals.css` 재작성 · `layout.tsx` 폰트 · `eslint.config.mjs` framer-motion guard · 의존성 6 추가
- [x] **BUILD S5:** marketing/auth/shared-marketing-shell v3 sweep 완료 (`src/app/[locale]/(marketing)/*`, `src/components/marketing/*`, `src/components/layout/*`, `src/app/(auth)/*`, `src/app/auth/*`, `src/components/auth/*`) + `tsc`/`eslint`/`vitest(auth-errors)` 통과
- [x] **BUILD S6:** admin/billing 표면 + legacy class wipe + `src/app/globals.css` v2 shim 제거 완료 (`rg` 기준 legacy 클래스 0건)
- [ ] **REFLECT:** S6 lock 시점에 라이트 스크린샷 · Lighthouse · a11y · PostHog `web_vitals`
- [ ] **ARCHIVE:** 슬라이스별 회고 통합 → `memory-bank/archive/work-history/archive-editors-desk-design-system-2026.md`

---

## INIT — Blog Subscription (Lemon, Phase 1) — 활성

**SoT:** [`docs/features/INIT-blog-subscription-lemon-phase1.md`](../docs/features/INIT-blog-subscription-lemon-phase1.md)  
**복잡도:** **L4** — 구독 스키마/웹훅/블로그 접근제어/페이월 UI/가격 페이지 동시 변경.

### 체크리스트

- [ ] **PLAN 문서화:** DB shape(`free|monthly|annual`, status, LS subscription id, period end) + 기존 entitlement/org plan과 공존 규칙
- [ ] **Webhook 확장:** `subscription_created|updated|cancelled|expired` 처리 + variant->tier 매핑 (`1585015`, `1585028`) + 멱등성
- [ ] **접근제어:** 블로그 `is_premium` + preview cutoff(30~40%) + reusable paywall CTA
- [ ] **Pricing/Manage:** 3티어 표 + checkout prefill(`checkout[email]`) + 구독자 상태/관리 링크
- [ ] **검증:** type/lint/unit + 프리미엄 글 접근 스모크 + webhook 시나리오

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
| A7 | 원격 작업 추적 — GitHub Issues/PR/gh · [`docs/DEV_PROCESS_GITHUB.md`](../docs/DEV_PROCESS_GITHUB.md) · [`.github/DESIGN.md`](../.github/DESIGN.md) · `pnpm issues:studio` | ✅ |

---

## AI 피벗 — Phase B (데이터·앱)

| # | 항목 | 상태 |
|---|------|------|
| B1 | 마이그레이션 `009` — `content_products`, `organization_content_entitlements` + RLS | ✅ |
| B2 | 대시보드 **Library** 우선 네비; MICE는 Legacy 그룹으로 이동 | ✅ |
| B3 | `pnpm db:types` 재생성 | **원격** Supabase(`.env.local`에 연결된 프로젝트)를 SoT로 `src/types/database.types.ts` 동기화. 로컬 CLI만 쓸 때는 그 프로젝트에 마이그레이션 적용 후 동일하게 실행 |
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
| M3 | 블로그 단편 글 (필라별, CTA→대기명단) | en+ko+ja+zh-CN+zh-TW 플래그십 `the-prompt-is-your-product-surface` + [`docs/BLOG_POST_PIPELINE.md`](../docs/BLOG_POST_PIPELINE.md) · **✅ 2026-04** |
| M4 | 전자책 SKU 슬라이스 (카탈로그·MDX·권한 — 기존 파이프라인에 맞춰 분할 출시) | MDX+런북 ✅ · **DB+Lemon 연결은 운영** [`PLAN-g1-first-ebook-sku-runbook.md`](../docs/features/PLAN-g1-first-ebook-sku-runbook.md) |
| M5 | PostHog: [`docs/POSTHOG_FUNNELS.md`](../docs/POSTHOG_FUNNELS.md) 퍼널 레시피 + 프로젝트 UI에서 대시보드 저장 | 레시피 ✅ · **UI 저장 절차** [`POSTHOG_DASHBOARD_FIRST_SAVE.md`](../docs/POSTHOG_DASHBOARD_FIRST_SAVE.md) — 대시보드 타일 저장은 **PostHog 프로젝트에서 운영 수행**(레포 자동화 아님) |
| M2.1 | 소셜·Linktree·자사 짧은 링크(`/ig`,`/yt`,`/links` 등) — [`MARKETING_OPS_CHECKLIST.md`](../docs/MARKETING_OPS_CHECKLIST.md) | ✅ 채널 1차·문서 |
| M3.1 | **Studio Productions** — 외부 AI 툴 산출물·프롬프트 원장 (v1: 링크·레이블·선택 숏컷만, API 연동 없음) | ✅ v1 앱 경로·워크벤치; 확장은 [`PLAN-studio-productions.md`](../docs/features/PLAN-studio-productions.md) · ADR [`003`](../docs/adr/ADR-003-studio-productions-mvp.md) |

**마케팅 실행 순서 (채널 구축 후 → 콘텐츠):** 아래를 위에서부터. 상세·카피는 [`MARKETING_OPS_CHECKLIST.md`](../docs/MARKETING_OPS_CHECKLIST.md) · 필라·캘린더는 [`marketing-pillars-m2.md`](marketing-pillars-m2.md).

1. **측정 열기:** PostHog 대시보드 저장(M5) — [`POSTHOG_DASHBOARD_FIRST_SAVE.md`](../docs/POSTHOG_DASHBOARD_FIRST_SAVE.md) · GSC 속성·사이트맵(미완 시).
2. **공유 품질:** 루트 `openGraph` 기본 이미지 — **`public/og-default.webp`** + [`layout.tsx`](../src/app/layout.tsx) **✅** · 추가 가이드는 [`MARKETING_OPS_CHECKLIST`](../docs/MARKETING_OPS_CHECKLIST.md) B4.
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

- [x] LS **상품·웹훅 URL·시크릿** · 테스트/프로덕션 — **✅ 2026-04** ([`api/webhooks/lemonsqueezy`](../src/app/api/webhooks/lemonsqueezy/route.ts), [`lemon-squeezy-webhook.ts`](../src/lib/payments/lemon-squeezy-webhook.ts))
- [x] 앱: **웹훅 수신** → 콘텐츠 **엔타이틀먼트** — [`content-entitlement.ts`](../src/lib/payments/content-entitlement.ts) 등 (Toss와 병행·역할은 [`ADR-005`](../docs/adr/ADR-005-payment-rails-lemon-primary-toss-deferred.md))
- [x] **구매→라이브러리 열람** — 구현 완료; 회귀는 운영/E2E로 추적
- [x] **Toss vs 글로벌(MoR)** 역할 — ADR·본 섹션·백로그 표에 반영

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

#### G3.1.2 — 파이프라인 **「초안 저장됨」** → 훅·초안 관리 다이얼로그 (INIT · 2026-04-17)

> **목표:** `tab=episode&episodePanel=pipeline` 제작 파이프라인 1단계에서 **「초안 저장됨」** 카드를 **열고 닫을 수 있는 전용 다이얼로그**로 연결해, 별도 **훅·초안(`episodePanel=draft`)** 탭 이동 없이 초안(훅·제목·스크립트·저장·(선택) LLM 생성·템플릿)을 관리한다.  
> **비목표 (INIT):** 기존 `production-episode-draft-panel.tsx` UI를 그대로 iframe/복제하는 것 — **디자인 시스템·대시보드 UX 원칙**에 맞춘 **사용자 중심 레이아웃**으로 재구성 (`docs/design/DASHBOARD_UX_PRINCIPLES.md`, `VISUAL_LANGUAGE_V2.md`).  
> **데이터:** 기존 `saveStudioEpisodeDraftManual` · `studio_production_artifacts`(hook/title/script_draft) · 스냅샷 — **스키마 변경 없이** 1차 구현 가능.

| INIT 앵커 | 파일 / 메모 |
|-----------|-------------|
| 파이프라인 카드 | [`production-episode-pipeline.tsx`](../src/components/dashboard/production-episode-pipeline.tsx) `PreprodDraftStepRow` · [`episode-draft-workbench.tsx`](../src/components/dashboard/episode-draft-workbench.tsx) |
| 초안 패널 (기능 SoT) | [`production-episode-draft-panel.tsx`](../src/components/dashboard/production-episode-draft-panel.tsx) → `EpisodeDraftWorkbench` `variant="panel"` |
| 서버 액션 | [`src/actions/studio-episode-llm.ts`](../src/actions/studio-episode-llm.ts) `saveStudioEpisodeDraftManual`, `generateStudioEpisodeDraft` 등 |
| 모달 프리미티브 | [`src/components/ui/modal.tsx`](../src/components/ui/modal.tsx) — 파이프라인은 이미 `Modal`로 View 모달 사용 중; 다이얼로그는 동일 계열 또는 확장 |
| 서브탭 라우팅 | [`src/lib/studio-productions/episode-detail-panel.ts`](../src/lib/studio-productions/episode-detail-panel.ts) `draft` vs `pipeline` |

**복잡도 초안:** **L3** — 신규/분리 컴포넌트(다이얼로그 본문), 기존 패널과 **로직 공유** 여부(훅·컴포저블 vs 중복 최소화), i18n·접근성(포커스 트랩·닫기), 선택 시 참조 패널 노출 범위.

**권장 워크플로:** **PLAN**(정보 구조·탭 vs 단일 스크롤·다이얼로그에 넣을 기능 범위) → **CREATIVE**(레이아웃 와이어·DS 토큰) → **BUILD** → **REFLECT**.

**PLAN 확정 (2026-04-17)**

| 결정 | 내용 |
|------|------|
| **범위 (MVP)** | 다이얼로그 = 파이프라인에서 **초안 작업의 속도 레인**. **기능은 draft 탭의 편집 가능 본문과 동일** — LLM 생성·다듬기·비교(apply/revert)·모델/템플릿 선택·`DraftTemplateManageDialog`·수동 저장·**스냅샷 목록+복원**. **제외:** `ProductionEpisodeReferencePanel` · 중첩 `ProductionEpisodePipeline` (이미 각각 별도 서브탭). |
| **draft 탭 역할** | 긴 작업·**소스·레퍼런스**·에피소드 카피( `episodePanelLeadDraft` )·한 화면에 파이프라인까지 펼친 **작업대**. 다이얼로그는 **「저장됨」카드에서 바로 이어서 편집**할 때만 쓰고, 필요 시 푸터/보조 링크로 `episodePanel=draft` 이동(선택). |
| **데이터 스레딩** | [`production-episode-detail-workspace.tsx`](../src/components/dashboard/production-episode-detail-workspace.tsx)에서 이미 갖는 값을 `ProductionEpisodePipeline`에 추가: `canEditDraft`, `customDraftTemplates`, `draftLlmAvailability`, `draftSnapshots`. (서버 액션·RLS 변경 없음.) |
| **구현 전략** | `ProductionEpisodeDraftPanelEditable`를 그대로 두 번 감싸지 않고, **공유 본문**을 `episode-draft-workbench.tsx`(가칭) 등으로 **추출**해 패널(embedded)과 다이얼로그가 동일 로직을 쓰게 한다. 다이얼로그는 `Modal` `size`를 **`xl` 이상(필요 시 `max-w-*` 한 단계 추가)**으로 하고, 본문은 **단일 스크롤** + 섹션 구분은 `border`/`divide`로 [`DASHBOARD_UX_PRINCIPLES.md`](../docs/design/DASHBOARD_UX_PRINCIPLES.md) 정합. |
| **마운트** | 다이얼로그 **열릴 때만** 워크벤치를 마운트해, 에피소드 화면에 이미 존재하는 숨김 draft 패널과 **편집기 인스턴스 난립**을 완화. 닫을 때 미저장 편집이 있으면 **닫기 확인**(선택·CREATIVE에서 결정). |
| **카드 UX** | `PreprodInfoRow`: 완료+편집 가능 시 **클릭 가능**(또는 보조 **「편집」** 텍스트 버튼). 미완료 시 기존 힌트 유지 + 동일 진입으로 **빈 초안 작성**. `canEditDraft === false`면 카드는 비활성 또는 읽기 전용 메시지 + draft 탭 안내(패널과 동일 정책). |
| **중첩 UI** | `DraftTemplateManageDialog`는 포털 사용 — **z-index**가 파이프라인 `Modal`(z-[80]) 위로 오는지 BUILD에서 확인. |
| **분석** | PostHog 이벤트(다이얼로그 오픈)는 **선택**·2차. |

**체크리스트 (완료 시 `[x]`)**

- [x] PLAN: 다이얼로그에 포함할 기능(수동 저장만 vs 생성·템플릿·스냅샷 일부)과 **draft 탭과의 역할 분담** 한 문단
- [x] CREATIVE: [`creative-pipeline-draft-dialog-2026-04.md`](archive/work-history/creative-pipeline-draft-dialog-2026-04.md) — 모달 셸·섹션 순서·카드 진입·미저장 닫기·DS 정렬
- [x] BUILD: `PreprodDraftStepRow` + `EpisodeDraftWorkbench` 다이얼로그 · 미저장 닫기 확인 · `Modal` `2xl`/`stackClassName` — **✅ 2026-04**
- [x] i18n: `Dashboard.productions` `pipelineDraft*` 키 (en/ko/ja/zh-CN/zh-TW)
- [x] REFLECT (2026-04-17): [`reflect-pipeline-draft-dialog-2026-04.md`](archive/work-history/reflect-pipeline-draft-dialog-2026-04.md) — 성공 기준 대조·교훈·선택 후속
- [x] ARCHIVE (2026-04-17): [`archive-pipeline-draft-dialog-2026-04.md`](archive/work-history/archive-pipeline-draft-dialog-2026-04.md) — 요약·수동 스모크 체크리스트·CREATIVE/REFLECT 아카이브 링크

#### G3.1.3 — 파이프라인에서 **입력 소스**(INIT·레퍼런스) 참조 (BUILD · 2026-04-17)

> **목표:** 소스·레퍼런스 탭에 넣은 링크·텍스트·메모(`artifact_role: reference_source`)를 **제작 파이프라인 탭**에서 끊김 없이 참고한다 (탭 이동 최소화).  
> **SoT:** [`docs/features/PLAN-pipeline-source-visibility.md`](../docs/features/PLAN-pipeline-source-visibility.md) · [`pipeline-reference-context.ts`](../src/lib/studio-productions/pipeline-reference-context.ts) · UI [`pipeline-reference-sources-strip.tsx`](../src/components/dashboard/pipeline-reference-sources-strip.tsx) (`ProductionEpisodePipeline` 진행률 바 아래).  
> **관련 UX:** 모델·사전 프롬프트 접기 — [`pipeline-step-advanced-toggle.tsx`](../src/components/dashboard/pipeline-step-advanced-toggle.tsx) (Lucide `SlidersHorizontal` / `ChevronUp`, 파이프라인·YouTube 업로드 카드).

#### G3.1.5 — **씬 이미지 → Runway I2V → 웹 편집 → Buffer 예약 발행** (INIT · 2026-04-23)

> **목표:** “키만 넣어두면 딸깍딸깍” — 씬별 **키프레임 이미지 생성(Nano Banana 2 / FLUX / Seedream)** → **First/Last Frame 고정** → Runway **image-to-video** → **웹 타임라인 편집** → **Buffer 3채널 예약 발행**까지 파이프라인 확장. 프롬프트 스튜디오의 발전형으로서 각 태스크에 맞게 프롬프트가 자동 최적화된다.
> **SoT (INIT):** [`docs/features/INIT-scene-image-to-video-and-publishing.md`](../docs/features/INIT-scene-image-to-video-and-publishing.md)
> **비목표 (INIT):** 코드 구현 — PLAN/ADR/CREATIVE 입력용 정리.

| INIT 요약 | |
|-----------|--|
| **복잡도** | **L4** — 신규 provider 5개 후보(Gemini Imagen/FLUX/Seedream + Runway I2V + Buffer)·마이그레이션 3~4개·대형 UI 2개(갤러리·편집기)·FFmpeg 그래프 확장 |
| **재활용 대상** | `studio_production_artifacts` 원장 · `studio_org_provider_connections` · OpenAI Images(썸네일) 경로 · Runway T2V 어댑터 · FFmpeg assembleVideo · YouTube OAuth 패턴 · `packaging_draft` LLM 경로 · 편집 프리셋 · `studio_projects.brand_guide` JSONB |
| **슬라이스** | **U1** 이미지 provider 추상화 + 4개 어댑터(Gemini/FLUX Replicate/FLUX fal.ai/Seedream) + 공식 문서 링크 · **U2** 씬 이미지 갤러리 + Character Bible + First/Last 지정 · **U3** Runway I2V 어댑터/프롬프트 + preflight · **U5~U6** 타임라인 편집기 · **U7~U9** Buffer 연동·캡션·예약 발행 |
| **Phase 매핑** | **Phase 1 = U1+U2+U3** · Phase 2 = U5+U6 · Phase 3 = U7+U8+U9 |
| **확정 결정 (INIT)** | D1: provider 4개 Phase 1 포함 · D2: FLUX Replicate+fal.ai 둘 다 · D3: `brand_guide` JSONB 확장 + Master Reference 아티팩트 · D4: UI는 First/Last 둘 다, 어댑터는 provider 능력별 주입 · D5: IDENTITY LOCK + reference image (LoRA는 비목표) · D6: 조직 기본값+에피소드 오버라이드 · D7: preflight만 · D8: 완성도 높은 MVP · **D9: 모든 UI에 provider 공식 문서 앵커 링크** |
| **ADR 후보** | **ADR-008** (이미지 provider + 키프레임 + 워터마크 정책) · **ADR-009** (편집 DSL + Buffer 예약) · (장기) ADR-010 LoRA/파인튜닝 |
| **다음 모드** | **PLAN** — Phase 1 집중 (사용자 답변: Phase 1 "완성도 높은 MVP"로 풀 볼륨) |

**체크리스트 (2026-04-24 업데이트 — Phase 1 + Phase 3 선행 완료)**

- [x] **PLAN (Phase 1 집중):** [`.cursor/plans/scene_keyframes_and_i2v_phase_1_*.plan.md`](../.cursor/plans/)
- [x] **ADR-009 (확정):** [`docs/adr/ADR-009-studio-image-providers-and-keyframes.md`](../docs/adr/ADR-009-studio-image-providers-and-keyframes.md) — plan의 ADR-008은 기존 번호와 충돌해 009로 조정
- [x] **Phase 1 BUILD (U1+U2+U3) — 2026-04-23** ✅
  - 마이그레이션 `038` (provider CHECK: flux_replicate/flux_fal/seedream) · `039` (character_bible JSONB + Master Reference URL/Storage Path)
  - 이미지 provider 추상화 + 4개 어댑터 ([`src/lib/studio-integrations/providers/images/`](../src/lib/studio-integrations/providers/images/))
  - `provider-docs.ts` 공식 문서 링크 SoT (D9)
  - Character Bible 하이브리드 JSONB + Master Reference 업로드 UI
  - 씬 이미지 갤러리 + First/Last Frame 지정 + IDENTITY LOCK 프롬프트
  - Runway I2V 어댑터 (capability 테이블 — veo3.1 기본 · first/last 자동 분기)
- [x] **Phase 3 BUILD (U7+U8+U9) — 2026-04-23** ✅ (Phase 2 선행 스킵)
  - 마이그레이션 `040` (buffer CHECK) · `041` (studio_scheduled_posts + RLS + UNIQUE 멱등)
  - Buffer GraphQL 어댑터 (createPost / createIdea / listChannels) + verify + env fallback
  - 플랫폼별 캡션 LLM (IG/TT/YT Shorts) + 수동 편집 저장
  - PublishScheduler UI + 예약/재시도/취소
- [x] **i18n:** `Dashboard.productions` 신규 키 (en/ko/ja/zh-CN/zh-TW, ~170개 키) · action-errors 23개
- [x] **VERIFY:** `pnpm verify` + `pnpm test:i18n` 통과 · 단위 테스트 298개
- [x] **미들웨어 Supabase 요청 최적화 — 2026-04-24** ✅ (`src/lib/proxy/skip-session.ts` + `src/proxy.ts` + 12 단위 테스트): 정적/웹훅/쿠키 없는 anon 요청에서 `getUser()` 왕복 제거. 4/23 33k/일 이슈 해소.
- [x] **Phase 2 BUILD (U5+U6) — 풀스크린 타임라인 편집기 — 2026-04-24** ✅
  - ADR-010 (`docs/adr/ADR-010-fullscreen-timeline-editor.md`) 작성
  - 편집 DSL v3 (`editor-dsl.ts` · 17 단위 테스트) + `dslToAssemblyJobInput` + JSONB 저장 (마이그레이션 0건)
  - 풀스크린 라우트 `/dashboard/productions/[episodeId]/editor` + 자체 layout + `EditorShell` + `useReducer` store + 3초 debounce autosave (`saveEditorDsl`)
  - PreviewPane: HTML5 `<video>` 연속 재생 + 플레이헤드 + 스크럽 바 + 재생/일시정지/리셋 컨트롤 + 오디오 2트랙 (narration + BGM) 동기화
  - Scene track: HTML5 native DnD 재배열 + 루프/전환 배지 / Scene inspector: trim·duration·transition·loop·open source
  - Overlay track: 시간 기반 텍스트 카드 (상/중/하/커스텀 좌표) + 폰트/색상/배경/불투명도/애니메이션(fade_in/slide_up) / OverlayLayer CSS 오버레이 준-프리뷰
  - Audio inspector: narration gain 슬라이더 + BGM URL/gain/startSec/fadeIn/fadeOut + 실시간 볼륨/페이드 반영
  - FFmpeg 확장: `ffmpeg-overlay-filter.ts` (drawtext chain + xfade + amix 빌더, 11 단위 테스트) + `video-assembly.ts` + `assemble-video-per-scene.ts` 두 번째 패스 + worker editor_extensions.overlays 라우팅
  - ExportDialog + `exportEditorToAssembly` 서버 액션 + 에피소드 페이지 "편집기 열기" CTA 카드 (5개 로케일)
- [x] **REFLECT / ARCHIVE — 2026-04-24** ✅
  - Phase 1 + Phase 3 REFLECT: [`archive/work-history/reflect-scene-keyframes-i2v-buffer-2026-04.md`](archive/work-history/reflect-scene-keyframes-i2v-buffer-2026-04.md)
  - Phase 2 + Reliability Hardening REFLECT: [`archive/work-history/reflect-fullscreen-editor-phase2-2026-04.md`](archive/work-history/reflect-fullscreen-editor-phase2-2026-04.md)
  - 통합 ARCHIVE 허브: [`archive/work-history/archive-scene-to-publish-2026-04.md`](archive/work-history/archive-scene-to-publish-2026-04.md)
- [ ] **Phase 2 polish (backlog):** overlay DnD on timeline · transition preview(CSS) · export 진행률 realtime 토스트
- [ ] **실사용 End-to-End smoke (보류):** Buffer 채널 연결 + 24h rate-limit 창 확보 후 1회전 증빙. 운영 전제조건은 [`archive-scene-to-publish-2026-04.md`](archive/work-history/archive-scene-to-publish-2026-04.md) 참고.

#### G3.1.4 — **씬** 단계: 사용자 영상 업로드 + TTS/자막 정렬 (INIT · 2026-04-17)

> **목표:** UI에서 **「씬 렌더 (Runway)」→「씬」** 등으로 정리하고, 씬별로 **Runway 생성 클립 대신(또는 혼합)** **임의 영상 파일**을 올리면 **에피소드 TTS·전체 자막**을 씬 길이에 맞게 잘라 최종 조립에 반영한다. **운영 서비스 수준**·**추가 SaaS 비용 없음**을 전제로 설계한다.  
> **SoT (INIT):** [`docs/features/INIT-scene-user-media-assembly.md`](../docs/features/INIT-scene-user-media-assembly.md)  
> **비목표 (INIT):** 코드 구현 — 아래는 PLAN/ADR/CREATIVE 입장용이다.

| INIT 요약 | |
|-----------|--|
| **복잡도** | **L4** — 스토리지·`assembleVideo` 확장(또는 씬별 전처리)·씬 메타·UI |
| **현재 조립** | 단일 TTS + 단일 SRT + 클립 concat — [`video-assembly.ts`](../src/lib/studio-productions/video-assembly.ts) |
| **다음 모드** | **PLAN** (데이터·잡 JSON·용량 상한) → **CREATIVE** (씬 카드 UX) → **BUILD** (분할 PR 권장) |

**체크리스트 (INIT 이후)**

- [ ] **PLAN:** 씬 소스 `runway \| upload` · 아티팩트 역할·Storage 경로·조립 잡 입력 v2 · 실패 시 씬 인덱스 표시
- [ ] **ADR (선택):** `ADR-008` 후보 — Runway vs 업로드 공존·저작권·비용 고지
- [ ] **CREATIVE:** 업로드 존·씬별 상태·(선택) 트림 초 — [`DASHBOARD_UX_PRINCIPLES.md`](../docs/design/DASHBOARD_UX_PRINCIPLES.md) 정합
- [ ] **BUILD:** i18n `draftSceneRenderCta` 등 — 카피 표 §6 INIT 문서
- [ ] **VERIFY:** `pnpm verify` · 대용량·코덱 실패 케이스 스모크

#### 의사결정 가이드 (이 블록만 읽어도 됨)

| 질문 | 권장 |
|------|------|
| 지금 **Runway를 매일** 돌려야 하나? | **아니오.** P0는 **앱에 기록 구조를 굳히는 것**이 우선. Runway는 샘플·채널용 **배치**로 충분. |
| **G2 Lemon**과 동시에 할까? | **G2 구현 완료(2026-04).** 이후 스프린트는 G3.1 운영 습관·Studio 확장 등으로 선택. |
| `compliance_note`를 지금 필수로? | **선택.** 유튜브 제재 대비가 목표면 **에피소드 `notes` 또는 아티팩트 1개**로 시작. |
| DB 마이그레이션 필요? | P0는 **기존 `artifact_role` 텍스트 + `metadata` jsonb**로 대부분 가능. 스키마 변경은 **P1**에서 검토. |

### G3.2 — Studio **v2** 도구 연동 (ADR-006 · 선택)

> **목표:** v1 원장(붙여 넣기)은 유지하고, 연동을 켠 조직만 서버에서 OpenAI / Runway / YouTube 등 **어댑터**를 호출할 수 있게 한다.  
> **SoT:** [`docs/adr/ADR-006-studio-provider-integrations-v2.md`](../docs/adr/ADR-006-studio-provider-integrations-v2.md) · [`docs/features/PLAN-studio-provider-integrations.md`](../docs/features/PLAN-studio-provider-integrations.md) · 코드 `src/lib/studio-integrations/`

| 단계 | 상태 |
|------|------|
| Phase 0 — ADR·PLAN·스캐폴드·연동 안내 페이지 (`/dashboard/productions/integrations`) | ✅ 준비됨 |
| Phase 1 — 조직 자격 증명 테이블·암호화·RLS | ✅ `024` + 앱 경로 |
| Phase 2 — OpenAI(호환) 첫 슬라이스 → 아티팩트 반영 | ⏳ (우선순위 별도 이슈) |
| Phase 3 — Runway 텍스트→비디오 (`runStep`·SDK 폴링) | ✅ **2026-04** ([`runway-adapter.ts`](../src/lib/studio-integrations/providers/runway/runway-adapter.ts), [`runway-text-to-video.ts`](../src/lib/studio-integrations/providers/runway/runway-text-to-video.ts)) |
| Phase 3b — YouTube OAuth·업로드 | ✅ 코드 경로 ([`youtube-upload.ts`](../src/lib/studio-integrations/providers/youtube/youtube-upload.ts) 등); 스텁 클릭·UI 문구는 매트릭스 참고 |

**API vs 구현 SoT (INIT마다 갱신):** [`docs/features/STUDIO_PROVIDER_API_CAPABILITY_MATRIX.md`](../docs/features/STUDIO_PROVIDER_API_CAPABILITY_MATRIX.md) — 벤더 API 가능 여부와 Elevate 구현을 구분; 사용자 카피는 “기술적 불가”와 “미연결”을 혼동하지 않도록 유지.

**다음 구현 우선순위 (갱신 2026-04-17):**

1. **초안 품질 리팩터** — 짧은 사용자 입력만으로도 니치·채널·포맷에 맞는 **구조적 초안**이 나오도록 `buildDraftPrompt`·시스템 프롬프트·(필요 시) 스키마 확장.
2. **OpenAI(호환) 아티팩트 슬라이스** — Phase 2 (별도 이슈 권장).

### G3.3 — Studio **AI 콘텐츠 OS** (INIT 보완 준비 · 2026-04)

> **배경:** 에피소드·아티팩트 원장([`ADR-003`](../docs/adr/ADR-003-studio-productions-mvp.md)) + 조직별 연동([`ADR-006`](../docs/adr/ADR-006-studio-provider-integrations-v2.md))은 **“모든 AI 산출물을 한곳에서 관리·생성”**까지 확장 가능한 **뼈대**로 적합하다는 점검 결론.  
> **PLAN 문서 (인터뷰 반영):** [`docs/features/PLAN-studio-ai-content-os.md`](../docs/features/PLAN-studio-ai-content-os.md) — 범위 문장·우선순위 스택·비목표·다음 단계.  
> **한계:** v1은 링크·텍스트 중심; **음악·TTS·립싱크·영상 바이너리**와 **다수 SaaS**는 **에셋 저장·잡(폴링)·제공자 매트릭스**가 추가 레이어. North Star([`creative-elevate-ai-pivot.md`](creative-elevate-ai-pivot.md))와 **범위 정렬**(MVP 경계) 선행 권장.

#### 점검 요약 (SoT로 유지)

| 판단 | 내용 |
|------|------|
| **데이터 모델** | `studio_production_episodes` + `studio_production_artifacts`로 **시나리오 = 에피소드(+포맷/니치) + 아티팩트 묶음** 해석 가능. 제품 카피에서 “시나리오” 매핑만 통일하면 됨. |
| **자격 증명** | `studio_org_provider_connections` + 암호화 — **LLM/툴 API 키** 패턴에 맞음. 제공자마다 ToS·검증 엔드포인트 상이. |
| **갭** | (1) `provider` CHECK·타입에 **Claude·ElevenLabs·음악 생성·립싱크** 등 대중 SaaS 축이 부족할 수 있음 (마이그레이션·PLAN). (2) **오디오/영상 파일**은 URL만으로 버티다 **Storage + asset 메타**로 갈지 결정. (3) **생성 실행**은 어댑터+잡+멱등 — ADR-006 방향과 정합. (4) **시나리오 = 여러 에피소드**가 필요하면 **그룹/폴더** 엔티티 후보. (5) `artifact_role` — TTS·stem·립싱크 등 **역할 확장**을 [`STUDIO_ARTIFACT_ROLES`](../docs/STUDIO_ARTIFACT_ROLES.md)에 합의. |

#### 다음 워크플로 (INIT →)

| 순서 | 산출물 | 담당 모드 |
|------|--------|-----------|
| 1 | **제품 범위 한 페이지** — “OS”에 포함할 생성 종류(예: 스크립트만 vs 음성·영상까지) · 비포함 명시 | PLAN / CREATIVE |
| 2 | **제공자 로드맵** — Claude / TTS(ElevenLabs 등) / 음악(Suno·Udio API 가능 시) / 아바타·립싱크(HeyGen·D-ID 등) **우선순위 2~3개**만 | PLAN |
| 3 | **스키마** — `024` 패턴으로 `provider` 확장 또는 **카테고리별 테이블** 검토 문서 | CREATIVE + BUILD |
| 4 | **아티팩트 역할** — 문서·`artifact-roles`에 신규 역할 추가 여부 | BUILD (소규모) |
| 5 | **에셋·잡** — 바이너리 저장·`studio_generation_jobs` 류 도입 시점 | PLAN (L3+) |

#### 백로그 체크리스트 (완료 시 `[x]`)

- [ ] North Star·운영 가능 리소스 대비 **“AI 콘텐츠 OS” MVP 범위** 문서화 (`docs/features/` 또는 `creative-*.md` 갱신)
- [ ] 통합 탭/PLAN에 **Anthropic(Claude)** · **TTS** · (선택) **음악·아바타** 제공자 후보와 **검증 전략** 1줄씩
- [x] `anthropic` provider — 마이그레이션 `025` + [`STUDIO_INTEGRATION_PROVIDER_IDS`](../src/lib/studio-integrations/types.ts) + list-models 검증 + Integrations 탭/i18n (2026-04)
- [ ] (선택) **에피소드 그룹(시나리오)** — 필요 시 ERD 스케치만 먼저

### G3.4 — 에피소드 **초안 템플릿·바이어스** (INIT 준비 · 2026-04)

> **목표:** 숏/채널에 맞춘 **규격·톤·구조**를 사전에 정의하고, 초안 생성 시 **선택한 템플릿을 LLM에 바이어스(추가 지시)**로 주입한다. 시스템 시딩 템플릿 vs 조직 커스텀 vs (선택) 파인튜닝은 **범위를 나눠** 단계 출시한다.  
> **비목표 (INIT):** 실제 구현·DB 마이그레이션 — 아래는 **다음 PLAN/CREATIVE 입장용 스캐폴드**다.

#### 현재 코드 앵커 (바이어스 주입 지점)

| 레이어 | 파일 / 함수 | 메모 |
|--------|-------------|------|
| 사용자 프롬프트 조립 | [`src/lib/studio-productions/episode-llm.ts`](../src/lib/studio-productions/episode-llm.ts) `buildDraftPrompt` | 에피소드 메타·채널·`userBriefing`·develop/fresh·온에디터 초안 JSON. **템플릿 본문은 여기에 블록으로 추가**하는 패턴이 자연스럽다. |
| 시스템 프롬프트 | 동 파일 `generateDraftWithLlm` | 짧은 역할 고정문; **톤/금지어/출력 스키마**를 템플릿 종류별로 바꾸려면 인자 확장 검토. |
| 서버 액션 | [`src/actions/studio-episode-llm.ts`](../src/actions/studio-episode-llm.ts) `generateStudioEpisodeDraft` | `FormData`에서 `draft_briefing`, `draft_generate_mode` 수신. **`draft_template_id` 등 필드 추가** 시 동일 패턴. |
| UI | [`src/components/dashboard/production-episode-draft-panel.tsx`](../src/components/dashboard/production-episode-draft-panel.tsx) | 템플릿 선택·커스텀 편집 진입점. |

#### 제품 결정 (PLAN에서 확정)

1. **템플릿 소스:** (A) 플랫폼 시딩만 (B) 조직별 저장 (C) 둘 다 + 기본값.  
2. **표현 형태:** 단일 **시스템/유저 블록 텍스트** vs **구조화 필드**(톤·훅 길이·CTA 규칙) + 조립.  
3. **“파인튜닝”:** 외부 모델 파인튜닝은 비용·거버넌스 큼 — **MVP는 프롬프트 바이어스만**으로 두고, 나중에 별도 ADR.  
4. **스냅샷 메타:** [`studio_episode_draft_snapshots`](../supabase/migrations/) `source`/메타 JSON에 **template_id** 기록해 재현 가능하게 할지.

#### PLAN 확정 (2026-04) — 실행 슬라이스

**비목표 (전 단계 공통):** 벤더 측 **모델 파인튜닝**; 템플릿만으로 JSON 스키마 자체를 바꾸는 일(키 추가 등) — 필요 시 별 ADR.

| Phase | 범위 | 데이터 | UI·코드 |
|-------|------|--------|---------|
| **P1 — MVP** | 플랫폼 **시딩 템플릿만** (코드 상수 또는 i18n 문자열 ID). `draft_template_key`를 FormData로 전달 → `buildDraftPrompt`에 **고정 블록**으로 삽입(예: “Style / structure bias: …”). 기본값 1개 + Shorts 일반·설명형 등 **N개**. | DB 없음. 템플릿은 [`draft-prompt-templates.ts`](../src/lib/studio-productions/draft-prompt-templates.ts)에 **키 + bias 텍스트** + 표시용 i18n 키. | [`production-episode-draft-panel.tsx`](../src/components/dashboard/production-episode-draft-panel.tsx): `FieldSelect`. [`studio-episode-llm.ts`](../src/actions/studio-episode-llm.ts): `normalizeDraftTemplateKey`. 스냅샷 메타 JSON에 `draft_template_key` 추가. **✅ 2026-04 BUILD** |
| **P2** | **조직 커스텀** 템플릿: 제목 + 바이어스 본문 저장, 목록은 org 스코프. | 마이그레이션 `029` + `studio_episode_draft_templates` + RLS. 폼 값 `custom:<uuid>`. | 패널 **템플릿 관리** 다이얼로그 + `studio-draft-templates` 액션 + `resolveDraftTemplateForGenerate`. **✅ 2026-04 BUILD** |
| **P3 (선택)** | 템플릿별 **시스템 프롬프트** 변형(톤·금지 강도). | P1 키 또는 P2 id를 `generateDraftWithLlm`에 전달. | 프롬프트 문자열 맵 또는 함수; 회귀 테스트로 JSON-only 유지 확인. |

**우선순위:** **P1만 먼저 BUILD** → 검증 후 P2 CREATIVE(ERD·RLS) → P3는 제품 피드백 후.

**성공 기준 (P1):** 사용자가 템플릿을 바꾸면 **동일 briefing으로도** 생성 결과 톤/구조가 의도적으로 달라짐; 스냅샷/감사에서 **어떤 템플릿으로 생성했는지** 추적 가능.

#### 권장 워크플로

| 단계 | 산출물 |
|------|--------|
| **PLAN** | MVP 범위: 시딩 템플릿 N개 + UI 셀렉터 + `buildDraftPrompt` 주입만 vs 조직 커스텀 테이블 포함 |
| **CREATIVE** | 템플릿 데이터 모델(테이블 vs JSONB), RLS, i18n(템플릿 이름·설명) |
| **BUILD** | 마이그레이션(필요 시) · 액션 · 패널 · `pnpm verify` |

**복잡도 초안:** 데이터까지 가면 **L3–L4** (스키마·RLS·관리 UI). 프롬프트 상수 + UI만이면 **L2–L3**.

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

## AI Content Factory — Phase S (YouTube 콘텐츠 파이프라인)

**의사결정 요약 (2026-04):** 에피소드 원장(ADR-003) + 제공자 연동(ADR-006) 기반 **콘텐츠 팩토리**. 상세: [`PLAN-studio-content-factory.md`](../docs/features/PLAN-studio-content-factory.md) · [`ADR-007`](../docs/adr/ADR-007-youtube-content-factory.md).

**세부 체크리스트는 레포 구현과 정합 완료:** [`docs/features/PHASE_S_AND_T_STATUS.md`](../docs/features/PHASE_S_AND_T_STATUS.md) — S1–S5 각각 마이그레이션·`src/`·워커 경로를 매핑했고, **남는 갭**은 운영 배포·추정 상수·심화 A/B 등으로 분리해 둠.

| 단계 | 이름 | 코드베이스 상태 (요약) |
|------|------|-------------------------|
| **S1** | TTS + 자막 | ✅ ElevenLabs·검증·`030` |
| **S2** | 씬 + Runway | ✅ 어댑터·파이프라인 |
| **S3** | FFmpeg 조립 | ✅ `studio_video_assembly_jobs` · `video-assembly.ts` |
| **S4** | YouTube | ✅ OAuth·업로드·`031` |
| **S5** | 분석 | ✅ `032` · `studio-analytics` (심화는 백로그) |

### 채널 전략 (참고)

- **니치:** AI/기술 교육 (한국어 + 영어)
- **포맷:** Shorts 40-60초, 주 3-5회
- **월 비용:** 벤더 가격표 변동 시 문서·`runway-scene-credits-estimate.ts` 갱신

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
| P1 | **글로벌 결제(MoR)** — Lemon 웹훅 → 엔타이틀먼트 | ✅ Phase G2 구현(2026-04) · 운영·회귀는 Toss와 병행 [`CONTENT_FUNNEL.md`](../docs/CONTENT_FUNNEL.md) |
| P1 | **시각 언어 v2** — [`docs/design/VISUAL_LANGUAGE_V2.md`](../docs/design/VISUAL_LANGUAGE_V2.md) 롤아웃 · [`PLAN_VISUAL_LANGUAGE_V2_ROLLOUT.md`](../docs/design/PLAN_VISUAL_LANGUAGE_V2_ROLLOUT.md) | ✅ PR-1–5 + 문서/PR-6(부분) 반영(2026-04); 스테이징 스크린샷·감사 리포트 갱신은 선택 |
| P1 | **대시보드 단일 표면 UX** — [`docs/design/DASHBOARD_UX_PRINCIPLES.md`](../docs/design/DASHBOARD_UX_PRINCIPLES.md) | ✅ 개요·라이브러리·설정·스튜디오·프로덕션 목록 등(2026-04); 팀·빌링 등은 동일 패턴으로 확장 가능 |
| P1 | **PROJECT_OVERVIEW §9 권고 1·2 (데이터 정합성)** — 마이그레이션 번호 충돌 + provider CHECK 드리프트 점검 | ✅ `013/014` 충돌 파일을 `042/043`으로 renumber, provider CHECK는 `025/030/038/040`로 이미 확장됨 |
| P1 | **PROJECT_OVERVIEW §9 권고 5·6 (메타 검증)** — artifact metadata zod + Lemon 멱등성 확인 | ✅ role별 zod 느슨한 검증 도입(`artifact-metadata-schemas.ts`), Lemon `ls_order_identifier`는 `018`에서 PK로 이미 멱등성 충족 |
| P1 | **PROJECT_OVERVIEW §9 권고 3·4 (Studio 견고성)** — Runway 크레딧 사전검증 + stale assembly job 회수 | ✅ Runway `organization.retrieve()` preflight + `044` stale recovery RPC(`retry_count`/`max_retries`) + 워커 주기 회수 |
| P1 | PostHog 대시보드(퍼널 시각화) | 이벤트: `elevate_funnel_*`, `elevate_waitlist_*`, `elevate_marketing_cta_click`, `elevate_blog_post_viewed` — [`docs/POSTHOG_FUNNELS.md`](../docs/POSTHOG_FUNNELS.md) 참고 후 UI에서 구성 |
| P1 | E2E CI — PR에 `run-e2e` 라벨 또는 수동 workflow | `e2e.yml` |
| P2 | **대시보드 접근 게이트** — `profiles.dashboard_access` · [`src/lib/auth/dashboard-access.ts`](../src/lib/auth/dashboard-access.ts) · `/access-pending` · PKCE 콜백 정리 | ✅ (2026-04) 마이그레이션 `037` + 서버 `SUPABASE_SERVICE_ROLE_KEY`; REFLECT [`archive/work-history/reflect-dashboard-access-pkce-2026-04.md`](archive/work-history/reflect-dashboard-access-pkce-2026-04.md) |
| P2 | MICE 스키마 제거 또는 아카이브 | 데이터·고객 영향 검토 후 |
| P2 | **롱폼·모바일 타이포 리듬** | ✅ Phase A–C [`docs/features/PLAN-responsive-longform-typography.md`](../docs/features/PLAN-responsive-longform-typography.md) — 배포 후 Lighthouse로 CV·LCP만 점검 |
| P2 | **Studio AI 콘텐츠 OS** — 제공자·에셋·잡 레이어 ([`tasks.md`](tasks.md) § G3.3) | INIT 준비됨 → PLAN 후 단계적 BUILD |
| P2 | **Studio 파이프라인 초안 다이얼로그** — PostHog `ELEVATE_STUDIO_PIPELINE_DRAFT_DIALOG_OPENED`(이름 합의) · 모달 **포커스 트랩**·오픈 시 **첫 필드/닫기 버튼** 초점(`Modal` / `EpisodeDraftWorkbench`) | G3.1.2 BUILD 완료 · 수동 스모크·CREATIVE §8은 [`archive-pipeline-draft-dialog-2026-04.md`](archive/work-history/archive-pipeline-draft-dialog-2026-04.md) |
| P2 | **Phase 2 편집기 polish** — (a) overlay DnD on timeline (현재는 클릭 선택만), (b) transition preview(CSS/Canvas), (c) export 진행률 realtime 토스트 | [`ADR-010`](../docs/adr/ADR-010-fullscreen-timeline-editor.md) 확장; 마이그레이션 불필요. 편집 반응성이 실사용자 피드백에서 병목으로 확인될 때 착수 |
| P2 | **실사용 End-to-End smoke (Phase 1→2→3)** — Gemini/Runway/Buffer 실키 1회전 증빙 (scene keyframe → I2V → editor → export → Buffer 예약) | 외부 전제조건: Buffer 채널 연결 + 24h rate-limit 창. 체크리스트는 [`archive-scene-to-publish-2026-04.md`](archive/work-history/archive-scene-to-publish-2026-04.md) |
| P3 | **private 버킷 + signed-URL 어댑터 (prod)** — Runway I2V가 public HTTPS를 요구하므로, prod에서 `elevate-content` 비공개 유지 시 signed URL 분기 필요 | REFLECT Phase 1 §follow-ups |
| P3 | **Buffer remote 취소 reconciliation worker** — 현재 cancel은 로컬 row만 업데이트 | REFLECT Phase 1 §follow-ups |

---

## 메모

- **서비스 롤**: 조직 자동 생성 등 관리 작업에만 사용; 클라이언트 번들 금지.
- **RLS**: `profiles.organization_id`가 없으면 데이터 접근이 막힐 수 있음 → 온보딩 필수.
- **gstack**: YC 관점 리뷰는 `/plan-ceo-review`, `/office-hours` 등 — `CLAUDE.md` 참고. **역할 분담**는 `docs/AI_ORCHESTRATION.md`.
