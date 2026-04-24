# Active Context — Elevate

## 현재 페이즈

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
