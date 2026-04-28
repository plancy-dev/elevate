# Active Context — Elevate

## 현재 페이즈 (활성)

**IMPLEMENT (2026-04-28) — Design System v3 "Editor's Desk" (편집자의 책상), S7 완료**

**브랜치:** `feat/editors-desk-v3` (main에서 분기, 별도 PR 단위)
**SoT:** [`docs/features/INIT-editors-desk-design-system.md`](../docs/features/INIT-editors-desk-design-system.md) · [`ADR-011`](../docs/adr/ADR-011-design-system-v3-editors-desk.md) (Accepted) · [`PLAN S0-S2`](../docs/features/PLAN-editors-desk-s0-s1-s2.md) · [`TOC IA`](../docs/design/v3-creative/toc-ia-mapping.md)

**복잡도:** **L4** — 디자인 토큰 전면 교체(ink/paper/vermilion) + 3서체(Fraunces/Geist/JetBrains Mono) + UI 프리미티브 10개 재작성 + 앱 쉘 교체(Sidebar→TOC, Masthead) + 시그니처 **Columnar Timeline** 신규 + Studio Phase 2 fullscreen editor 표면 sweep + 마케팅·어드민·인증 전 라우트. **스키마/서버 액션/마이그레이션 변경 없음**(순수 표현 계층).

**이전 시도(2026-04-24):** 동일 작업이 한 차례 진행되었으나 main에 머지되지 않은 채 사라졌고, ADR-010 번호는 별도 주제(`ADR-010-fullscreen-timeline-editor`)에 재배정됨. 본 재시작은 **ADR-011**을 사용하고, Q1-Q9 결정은 그대로 가져가며 Q10(`src/components/desk/` 경로 — `dashboard/editor/`와 어휘 충돌 회피)을 추가.

**확정 결정 (Q1-Q10):**
- **Q1** v2 문서 즉시 archive → `memory-bank/archive/design-v2/` (S0)
- **Q2** 마케팅 오렌지 폐기 (버밀리언 유일 크로매틱)
- **Q3** Framer Motion 경로 제한 — `src/components/desk/**` + 지정된 micro-interaction 경로만
- **Q4** Tailwind 완전 교체 — S0는 v2 토큰 shim으로 빌드 보호; S6에서 namespace lock
- **Q5** 다크 테마 Phase 2 (S7)
- **Q6** TOC IA Option A (Editorial metaphor): I. Studio / II. Scripts / III. Library / IV. House / V. Settings
- **Q7** CJK 폴백 — Noto Serif KR/JP/SC/TC + 시스템 산세리프
- **Q8** Fraunces display-lg 1 weight만 preload + `display=swap`
- **Q9** ColumnTimeline 데이터 — 기존 `resolve-episode-scenes.ts` + `studio-productions.ts` 재사용; 스키마 무변경
- **Q10** `src/components/desk/` 경로 (Studio Phase 2의 `src/components/dashboard/editor/`와 어휘 충돌 회피)

**슬라이스 순서:** S0 (Tokens+Fonts+Archive, L2) → S1 (Primitives, L3) → S2 (Shell TOC/Masthead/CommandBar, L3) → **S3 (Columnar Timeline 시그니처, L3)** → **S4 (Scene/Publish + Phase 2 sweep, L3)** → **S5 (Marketing+Auth, L3)** → **S6 (Admin+Billing + namespace lock, L2)** → **S7 (Dark, 선택, L2)**. 각 슬라이스 = 1 commit, 전체 = 1 PR.

**완료된 이번 단계 (S7):** 다크 테마 토글 경로를 v3 토큰과 완전 동기화. `src/styles/tokens.css`에서 다크 오버라이드를 `.dark` + `[data-theme="dark"]` + `:root.dark`로 통합하고 `color-scheme: dark`를 적용. `src/app/globals.css`의 semantic dark alias도 동일 선택자 집합으로 정렬해 시스템/수동 토글 모두 일관 동작.

**검증:** `pnpm -s tsc --noEmit` + `pnpm -s eslint src --max-warnings=0` + `pnpm -s vitest run tests/unit/auth-errors.test.ts tests/unit/editor-dsl.test.ts` 통과.

**다음 단계:** Editor's Desk v3 슬라이스(S0-S7) 구현 완료. 필요 시 최종 QA/ship 단계(수동 다크 스모크 + PR 정리)로 전환.

**04-24 학습(반드시 회피):**
- L1: PostCSS 8.4.31 + Turbopack은 CSS 주석의 em-dash(`U+2014`)에 `Unknown word` 에러 → tokens.css/globals.css 주석 ASCII-only.
- L2: `@theme { --shadow-*: initial; }` namespace wipe는 ~40 콜러 즉시 깨짐 → S0 v2-shim 보호; S6에서 lock.
- L3: Modal/CommandBar는 framer-motion 필요하나 `src/components/ui/modal.tsx`는 ESLint 차단 → Modal을 `desk/`에 두고 ui/는 thin re-export.
- L4: `next/font/google` 제거 시 `${geistSans.variable}` 잔존 → SSR 깨짐.
- L5: `design-system-classes.ts` 즉시 삭제 시 3 콜러 깨짐 → S0 stub, S1 마이그레이션 후 삭제.

---

## 직전 페이즈 (보관, 2026-04-24)

**Phase 1+2+3 완료 + REFLECT/ARCHIVE 문서화 완료 (2026-04-24)**
**SoT:** [`docs/features/INIT-scene-image-to-video-and-publishing.md`](../docs/features/INIT-scene-image-to-video-and-publishing.md) §4.2 · [`ADR-009`](../docs/adr/ADR-009-studio-image-providers-and-keyframes.md) · [`ADR-010`](../docs/adr/ADR-010-fullscreen-timeline-editor.md) · **tasks:** [`tasks.md`](tasks.md) **§ G3.1.5**

**아카이브 허브:** [`archive/work-history/archive-scene-to-publish-2026-04.md`](archive/work-history/archive-scene-to-publish-2026-04.md)
- Phase 1 + Phase 3 REFLECT: [`reflect-scene-keyframes-i2v-buffer-2026-04.md`](archive/work-history/reflect-scene-keyframes-i2v-buffer-2026-04.md)
- Phase 2 + Reliability Hardening REFLECT: [`reflect-fullscreen-editor-phase2-2026-04.md`](archive/work-history/reflect-fullscreen-editor-phase2-2026-04.md)

**함께 랜딩된 안정화 (REFLECT Readiness Plan 2026-04-24):**
- P0 buffer correctness — 벌크 재시도 에러 집계 정정 + DB update 실패를 `dbError`로 표면화 + `pending` 개별 재시도 UX
- P1 assembly maintainability — `ffmpeg-common.ts` 공용 헬퍼 추출 + 에러 union 정렬 + `editor_extensions` 주석
- P1 E2E stability — 하이드레이션 가드(`hydration-guard.ts`) + 로케일 안정 auth selector + `button:visible` + `requireVisibleBufferChannelChip()`
- P2 ops docs — 수동 운영 체크리스트 · worker 인시던트 런북 · live-smoke 전제조건 · IMPLEMENT validation gate
- `proxy.ts` DB 요청 최적화 (33k/일 → 대폭 감소, 2026-04-24)

**품질 게이트:** `pnpm typecheck` · `pnpm lint` · `pnpm test`(325) · `pnpm test:e2e tests/e2e/auth-*` green. live-phase* 는 Buffer 채널 prerequisite 외에는 결정적 동작.

**PR-1 (데이터 정합성) 진행 메모 · 2026-04-27:** Supabase 로컬 마이그레이션 번호 충돌(`013`/`014`)은 최신 생성 파일을 `042`/`043`으로 renumber 처리. `studio_org_provider_connections.provider` CHECK는 `025`·`030`·`038`·`040`에서 이미 확장되어 현재 코드 기준 enum 드리프트 이슈는 해소됨.
**PR-3 (메타 검증) 진행 메모 · 2026-04-27:** `artifact-metadata-schemas.ts`에 role별 zod 스키마/디스패처를 도입해 `scene_clip`·`tts_audio`·`subtitle_srt`·`assembled_video`·`social_captions`·`scene_keyframe_*` write 경로에 느슨한 정규화를 적용했다. Lemon 주문 멱등성은 `018`의 `ls_order_identifier PRIMARY KEY`로 이미 충족됨을 확인.
**PR-2 (Studio 견고성) 진행 메모 · 2026-04-27:** Runway I2V는 `organization.retrieve()` 기반 크레딧 preflight를 추가했고, `studio_video_assembly_jobs`는 `044` 마이그레이션으로 stale recovery RPC/`retry_count`를 도입해 워커 시작·주기 실행 시 stuck `processing` 잡을 자동 회수한다.

**다음 후보:**

---

## 남은 작업 (보류 포함, 2026-04-24 기준)

| 상태 | 항목 | 비고 |
|------|------|------|
| **보류 (외부 전제조건)** | 실사용 End-to-End 1회전 증빙 (Phase 1→2→3) | Buffer 채널 연결 + 24h rate-limit 창 확보 필요. 운영 체크리스트는 아카이브 허브 §운영 전제조건 |
| **백로그 (P2)** | Phase 2 polish — overlay DnD on timeline, transition preview(CSS), export 진행률 realtime 토스트 | [`ADR-010`](../docs/adr/ADR-010-fullscreen-timeline-editor.md) 확장, 마이그레이션 불필요 |
| **백로그 (P3)** | private 버킷 + signed-URL 어댑터 (prod), Buffer remote 취소 reconciliation worker | REFLECT Phase 1 §follow-ups 참고 |
| **운영 보류** | 스테이지/프로덕션 배포 & 모니터링, commit/PR | 사용자 명시 지시 시 착수 |

**"지금 당장 더 이상 끝낼 수 있는 코드 작업 없음"** — 다음 착수 지점은 사용자 판단.

---

**INIT (2026-04-17) — 씬 단계: 사용자 영상 + TTS/자막 정렬 (운영 수준 설계)** — 상위 INIT으로 흡수됨(G3.1.5).
**SoT:** [`docs/features/INIT-scene-user-media-assembly.md`](../docs/features/INIT-scene-user-media-assembly.md) · **tasks:** [`tasks.md`](tasks.md) **§ G3.1.4**

---

**INIT (2026-04) — Runway 이전 단계 품질** — 1차 **완료:** 에피소드 맥락(`pipeline_prefs.draftWorkbench.stickyContext`) + 생성 시 `brandGuide` 주입 + UI. SoT: [`INIT-pipeline-quality-upstream-of-runway.md`](../docs/features/INIT-pipeline-quality-upstream-of-runway.md) · REFLECT: [`archive/work-history/reflect-init-upstream-draft-quality-2026-04.md`](archive/work-history/reflect-init-upstream-draft-quality-2026-04.md). **다음(선택):** 다른 파이프라인 모달에 동일 패턴 — INIT §2.2.  
**“그 밖의 백로그” 조회만:** [`docs/internal/BACKLOG_INDEX.md`](../docs/internal/BACKLOG_INDEX.md) — **우선순위 추천 없음** (담당자 지시 전까지).

**AI Content Factory — Phase S (YouTube 콘텐츠 파이프라인)**  
North Star: [`creative-elevate-ai-pivot.md`](creative-elevate-ai-pivot.md). 기존 Studio Productions 원장 + Runway 연동을 확장하여 **스크립트 → TTS → 영상 → 조립 → YouTube 업로드** 파이프라인 구축. 상세: [`PLAN-studio-content-factory.md`](../docs/features/PLAN-studio-content-factory.md) · [`ADR-007`](../docs/adr/ADR-007-youtube-content-factory.md).

**INIT → … → ARCHIVE (2026-04-17) — 파이프라인 「초안 저장됨」→ 훅·초안 다이얼로그:** SoT: [`tasks.md`](tasks.md) **§ G3.1.2** · 아카이브 허브 [`archive/work-history/archive-pipeline-draft-dialog-2026-04.md`](archive/work-history/archive-pipeline-draft-dialog-2026-04.md) · CREATIVE/REFLECT 동일 폴더. **백로그:** PostHog·포커스 a11y — [`tasks.md`](tasks.md) 백로그 표 P2.

### 최근 출시 (앵커)

**Library · Billing · Lemon (2026-04)** — 제목 상세·체크아웃 진입, 구매 기록, 빌링 중복 카드 제거 및 사용자용 i18n 정리. 아카이브: [`archive/work-history/archive-dashboard-billing-library-lemon-2026-04.md`](archive/work-history/archive-dashboard-billing-library-lemon-2026-04.md).

**Studio Productions (제작 원장)** — v1 라우트·워크벤치 구현됨: `/dashboard/productions`, `/dashboard/productions/new`, 에피소드 상세. ADR·PLAN은 확장·운영 시 참고.

- ADR: [`docs/adr/ADR-003-studio-productions-mvp.md`](../docs/adr/ADR-003-studio-productions-mvp.md)  
- PLAN·리뷰: [`docs/features/PLAN-studio-productions.md`](../docs/features/PLAN-studio-productions.md) · [`docs/features/GSTACK_REVIEW-production-workbench.md`](../docs/features/GSTACK_REVIEW-production-workbench.md)  
- **v2 연동(스캐폴딩):** [`docs/adr/ADR-006-studio-provider-integrations-v2.md`](../docs/adr/ADR-006-studio-provider-integrations-v2.md) · [`docs/features/PLAN-studio-provider-integrations.md`](../docs/features/PLAN-studio-provider-integrations.md) · 라우트 `/dashboard/productions/integrations` · `src/lib/studio-integrations/` — 플래그 꺼짐 시에도 문서·상태 표시만.

**대시보드 접근** — 항상 **`profiles.dashboard_access`** (마이그레이션 `037`); 서버에서 서비스 롤로 조회. 아니면 `/access-pending`. REFLECT: [`archive/work-history/reflect-dashboard-access-pkce-2026-04.md`](archive/work-history/reflect-dashboard-access-pkce-2026-04.md).

**다음 (로드맵):** [`tasks.md`](tasks.md) — Phase S 파이프라인은 코드·스키마 기준 **정합 완료** ([`docs/features/PHASE_S_AND_T_STATUS.md`](../docs/features/PHASE_S_AND_T_STATUS.md)). 병행: Phase G 잔여(G1 운영 SKU 등) · Phase M · Phase T5 백로그.

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

**Content Factory Phase S:** [`PHASE_S_AND_T_STATUS.md`](../docs/features/PHASE_S_AND_T_STATUS.md) — `tasks.md` 구식 `[ ]` 제거·코드 매핑 완료.

**상업·운영:** **G2 Lemon 웹훅 → 엔타이틀먼트 ✅ (2026-04).** **G0:** [`PLAN-g0-creator-commerce-decisions.md`](../docs/features/PLAN-g0-creator-commerce-decisions.md) · [`ADR-005`](../docs/adr/ADR-005-payment-rails-lemon-primary-toss-deferred.md). **G1/M4:** [`PLAN-g1-first-ebook-sku-runbook.md`](../docs/features/PLAN-g1-first-ebook-sku-runbook.md). **M5:** [`POSTHOG_DASHBOARD_FIRST_SAVE.md`](../docs/POSTHOG_DASHBOARD_FIRST_SAVE.md) (대시보드 저장은 PostHog UI). 참조: [`content-entitlement.ts`](../src/lib/payments/content-entitlement.ts).

**Productions P0:** [`tasks.md`](tasks.md) **§ G3.1** — P0-1·P0-2·P0-3 구현됨; 남은 것은 팀 습관 체크리스트.

**INIT → 다음:** [`tasks.md`](tasks.md) **§ G3.2** — Runway·YouTube 경로 **구현됨**; 남은 우선순위는 **초안 품질**·OpenAI(호환) Phase 2 등.

**INIT (2026-04) — Studio AI 콘텐츠 OS 보완:** SoT: [`tasks.md`](tasks.md) **§ G3.3**. **완료:** Anthropic 연동 · Runway `runStep` 텍스트→비디오(SDK) · YouTube 업로드 경로(코드). **다음:** G3.3 문서·OpenAI 슬라이스 — [`STUDIO_PROVIDER_API_CAPABILITY_MATRIX.md`](../docs/features/STUDIO_PROVIDER_API_CAPABILITY_MATRIX.md).

### 의사결정 (Productions P0 vs 결제)

| 상황 | 추천 |
|------|------|
| 수익·운영 SKU | **G1** 런북(`content_products` 행·CTA) · Lemon은 **이미 연결됨** |
| 숏·도구 실험 기록이 제품 스토리의 중심 | **G3.1** 운영 습관·에피소드 루틴 |
| 한 명만 개발 | **한 줄로만** 정함: “이번 주는 G1” 또는 “G3.3 문서” 등 |

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
| Prompt Studio 베타 허용 | 마이그레이션 `016` `prompt_studio_beta_allowlist` · `/admin/prompt-studio-allowlist` · env `STUDIO_BETA_REQUIRE_ALLOWLIST` (스튜디오 라우트); **`/dashboard` 셸**은 `profiles.dashboard_access` + [`dashboard-access.ts`](../src/lib/auth/dashboard-access.ts) |
| 블로그 조회 이벤트 | PostHog `elevate_blog_post_viewed` — `src/components/blog/blog-post-viewed-capture.tsx` |
| **M3 (플래그십)** | 슬러그 `the-prompt-is-your-product-surface` — en · ko · ja · zh-CN · zh-TW (`content/blog/<locale>/`) · [`BLOG_POST_PIPELINE.md`](../docs/BLOG_POST_PIPELINE.md) |

## AI / Cursor

- **`memory-bank/tasks.md`** — 단일 우선순위
- **`docs/AI_ORCHESTRATION.md`** — gstack·Memory Bank·저장소 규칙 레이어 (허브)
- **`.cursor/rules/ai-session-bootstrap.mdc`** — 구현·버그·기능 시 `tasks`/`activeContext` 자동 로드
- **`docs/AI_USER_TEMPLATES.md`** · **`docs/AI_WORKFLOW_PORTABILITY.md`** — 요청 형식·타 레포 이식
- **`CLAUDE.md`** — gstack 스킬·브라우징; `docs/GSTACK.md` 설치
