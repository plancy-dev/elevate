# Elevate — Tasks (Stabilization SoT)

## INIT — Remaining work bootstrap (2026-05-05)

**세션 목적:** INIT·P0·P1·큐(#55–#59) 완료 이후 **남은 체크포인트**에 대한 진입 정리. 상세 표·체크리스트는 [`memory-bank/activeContext.md`](activeContext.md) **Current Phase — INIT**.

| 우선 질문 (INIT에서 1개만 답하면 PLAN/BUILD로 넘어감) | 기본 증거/참조 |
|------------------------------------------------------|----------------|
| 오늘 트랙: **Ops** / **PostHog ADR-013** / **ENH #62·#60·#61** / **#73 합의** 중 무엇인가? | `activeContext` 인벤토리 표 |
| Ops면: DB 스트릭 재측정 시점·`automation-off` 필요 여부? | `pnpm run content-ops:runs-invariant-check` → `reports/*.json` |
| PostHog면: 프로젝트·브라우저 키·라이브 클릭으로 0건 원인 분기? | [`reports/reflect-adr013-posthog-2026-05-04.md`](../reports/reflect-adr013-posthog-2026-05-04.md) |
| #62 잔여면: 안 B 진행 vs #60 블로킹 코멘트 먼저? | [`memory-bank/creative-dashboard-sidebar.md`](creative-dashboard-sidebar.md) |

**Non-negotiable:** `activeContext.md` § Non-Negotiable · #60 히어로 PR은 시나리오 코멘트 전 금지(`tasks.md` PLAN snapshot §7).

## PLAN — Remaining closure (2026-05-05)

**From INIT:** 트랙 후보 Ops · PostHog ADR-013 · #62 · #60 · #61 → **PLAN 전환 완료**. 실행 순서·슬라이스 체크리스트: [`memory-bank/activeContext.md`](activeContext.md) **Current Phase — PLAN**. BUILD 세션은 트랙 하나만.

## BUILD track (active) — 2026-05-04

- **Scope (merged):** ADR-013 PR2 — wire [`PostHogEvent.ELEVATE_MARKETING_CTA_CLICK`](../src/lib/analytics/posthog-events.ts) at 8 surfaces per [`docs/adr/ADR-013-marketing-cta-instrumentation-phase-1.md`](../docs/adr/ADR-013-marketing-cta-instrumentation-phase-1.md) Decisions #2–#3; required props `cta_id` + `locale`; optional `slug` (blog footer), `referrer_path` where useful.
- **Verify:** `pnpm verify`; `tests/unit/marketing-cta-instrumentation.test.ts` + stable-values test (**done** in repo).
- **Ops:** Local SoT snapshot saved as [`reports/2026-05-03-runs-invariant-build-handoff.json`](../reports/2026-05-03-runs-invariant-build-handoff.json). **Prod GET** `automation-run?scenario=daily_generation&source=cursor&token=…` remains operator-owned (Vercel token, no secret in git).
- **BUILD 2026-05-04 (증거만):** `pnpm run content-ops:runs-invariant-check` → [`reports/2026-05-04-runs-invariant-check.json`](../reports/2026-05-04-runs-invariant-check.json); `tasks.md` Immediate Next Step 갱신. **REFLECT:** PostHog cta_id + Vercel runtime·토큰 스모크.

## INIT closeout — handoff to PLAN (2026-05-04)

**INIT (this wave):** Stabilization + queue automation foundation in repo is **complete** for handoff purposes. **Next mode:** BUILD (see **BUILD track** above) then REFLECT.

| Artifact | Role |
|----------|------|
| [`reports/content-ops-morning-handoff-2026-05-03.md`](../reports/content-ops-morning-handoff-2026-05-03.md) | Operator morning checklist, newsletter locale truth, cron vs runtime |
| [`docs/adr/ADR-012-positioning-2026-q2-scenario-a-media-first.md`](../docs/adr/ADR-012-positioning-2026-q2-scenario-a-media-first.md) | Positioning / morning-ops Phase 1 SoT |
| [`docs/adr/ADR-013-marketing-cta-instrumentation-phase-1.md`](../docs/adr/ADR-013-marketing-cta-instrumentation-phase-1.md) | PR1 merged → in-tree plan for PR2 (8 surfaces + 5-locale Vitest); **PR2 prompt after merge** (short: ADR-013 Decisions #2/#3 + file paths) |

**Expert decision — `CONTENT_OPS_AUTOMATION_RUNTIME` missing in Vercel:** Unset env **equals `cursor`** in code (`automation-config.ts`). Vercel “no results” for the name is **implicit default**, not a different runtime. **P0 ops (no deploy code required):** add **`CONTENT_OPS_AUTOMATION_RUNTIME=cursor`** in Vercel Production so dashboards match RUNBOOK preflight and on-call mental model. **While `cursor`:** `vercel.json` crons that use `source=vercel-cron` **will skip** (`runtime_secret_mismatch`) — intentional cursor-first policy; PLAN may choose to trim cron noise or keep as dormant fallback.

## PLAN — AI-native workflow evolution (2026-05-03)

- **Epic (process, not product):** [`docs/features/PLAN-ai-native-workflow-evolution-2026-05.md`](../docs/features/PLAN-ai-native-workflow-evolution-2026-05.md) — **P0/P1 + P2 RFC·문서 게이트 PR** 머지됨 → 구현 세션은 [#73](https://github.com/plancy-dev/elevate/issues/73) 합의 후. **검수 한 페이지:** [`docs/features/PLAN-ai-native-workflow-doc-gate.md`](../docs/features/PLAN-ai-native-workflow-doc-gate.md) · P2 RFC [`docs/features/PLAN-ai-native-workflow-p2-rfc.md`](../docs/features/PLAN-ai-native-workflow-p2-rfc.md). 원격 이슈·PR 번호: [`docs/DEV_PROCESS_GITHUB.md`](../docs/DEV_PROCESS_GITHUB.md). 머지 직후 REFLECT 한 줄은 doc-gate §4.
- **Skill-first INIT (세션 지시 형태 전환 게이트):** 팀이 **「세션 시작은 `@elevate-memory-bank-bootstrap` 지명이 기본」**이라고 합의했거나, P2 **Hooks**가 merge되어 프롬프트 전 훅이 표준이 된 경우 → 아래를 `[x]`로 바꾼다. **그때부터** 사용자는 긴 "INIT 모드에서…" 대신 **스킬 한 줄 + 목표**만 주면 되고, 에이전트는 그 형태에 맞춘다. 가이드: [`docs/MEMORY_BANK_SKILL_GUIDE.md`](../docs/MEMORY_BANK_SKILL_GUIDE.md).  
  - [ ] Skill-first INIT 활성 (위 조건 충족 시 체크; 체크 후 채팅에 **「스킬 기본 전환됨」** 한 줄 주면 이후 세션 정렬이 빠름)

## PLAN backlog — first slice (order TBD in PLAN session)

1. **Ops:** Vercel explicit `CONTENT_OPS_AUTOMATION_RUNTIME=cursor` + redeploy note in RUNBOOK (done in repo doc / `.env.local.example`; operator applies in dashboard).
2. **Optional engineering:** Reduce `vercel-cron` mismatch **noise** (document-only vs remove/disable crons until fallback vs other) — decide in PLAN with cost of losing one-click fallback.
3. **Newsletter product (from morning handoff §6):** per-locale body strategy; subscriber self-serve locale + optional `profiles.ui_locale` sync; optional aggregate PostHog send event (no PII).
4. **Product:** After ADR-013 PR1 **merge**, PR2 wiring prompt (user: separate short prompt).

## Current Mission (SoT)

### INIT Stabilization Execution from GitHub Issues

Goal: execute stabilization backlog from remote issues after INIT foundation delivery.

## Execution Queue

### Foundation Completed (INIT)

- [x] #38 `[INIT][P0] quality-delta-window-contract`
- [x] #39 `[INIT][P0] publish-outcome-taxonomy`
- [x] #40 `[INIT][P1] autotune-strategy-tagging`
- [x] #41 `[INIT][P1] autotune-strategy-scoreboard`
- [x] #42 `[INIT][P1] review-gate-structural-guards`

### Foundation Completed (INIT Week 2)

- [x] #43 `[INIT][P1] citation-coverage-metric`
- [x] #44 `[INIT][P2] newsletter-retry-policy-matrix`
- [x] #45 `[INIT][P2] ops-alert-hardening`
- [x] #46 `[INIT][P2] daily-ops-snapshot`
- [x] #47 `[INIT][P2] three-day-regression-escalation`

### Stabilization Queue (P0 -> P1)

- [x] #49 `[STAB][P0] newsletter-delivery-config-hardening`
  - Owner: `MyungJin Ko`
  - Order: `1`
  - Status: `operational_gate_passed`
  - Acceptance: `resend_not_configured` near-zero in 24h and `send_failed` decay after controlled publish window.
  - Verify: `pnpm tsx scripts/content-ops-quality-monitor.ts` + `content_publications` grouped by `last_error,status`.
- [x] #50 `[STAB][P0] retry-waste-reduction-exhaustion-path`
  - Owner: `MyungJin Ko`
  - Order: `2` (starts after #49 baseline comparison)
  - Status: `operational_gate_passed`
  - Acceptance: DoD `retry_exhausted` 감소 + publish fail ratio `< 20%` 추세.
  - Verify: quality monitor + 7d DoD retry/fail SQL trend.
- [x] #51 `[STAB][P0] novelty-recovery-pass`
  - Owner: `MyungJin Ko`
  - Order: `3` (starts after #49/#50 publish-path stabilization)
  - Status: `operational_gate_passed`
  - Acceptance: one full cycle after change shows lower `low_novelty` share and better blog review-required trend.
  - Verify: `pnpm run content-ops:gate51-trend-check` + quality monitor + `content_items` low_novelty/review_required SQL.
- [x] #52 `[STAB][P1] strategy-scoreboard-activation-quality`
  - Status: `operational_gate_passed` (GitHub closed 2026-05-03)
  - Acceptance: strategy scoreboard sample non-zero and winner selection meaningful.
  - Verify: snapshot output + `/admin/content-quality` scoreboard state.
- [x] #53 `[STAB][P1] citation-coverage-enablement`
  - Status: `operational_gate_passed_initial_trend` (GitHub closed 2026-05-03)
  - Acceptance: `citationCoverage7dAvg` becomes non-zero and trendable.
  - Verify: quality monitor 24h/7d citation cards + reason distribution.
- [x] #54 `[STAB][P1] escalation-action-loop-hardening`
  - Status: `operational_gate_passed_simulated_e2e` (GitHub closed 2026-05-03)
  - Acceptance: regression alert path includes owner-assigned next-action loop.
  - Verify: `content_runs.metadata.alert` payload usability + `/admin/morning-ops` action flow.

- [ ] [STAB][P1] marketing-cta-instrumentation-phase-1
  - Owner: rayleighko
  - Order: after #60 hero PR / parallel-safe with #61, #62
  - Status: merged_to_main_2026-05-04_pending_posthog_reflect
  - **REFLECT (2026-05-04):** PostHog MCP HogQL — `elevate_marketing_cta_click` **8d count=0** (project 358775). ADR-013 §5 게이트 **미충족**. 증거: [`reports/reflect-adr013-posthog-2026-05-04.md`](../reports/reflect-adr013-posthog-2026-05-04.md). 다음: UI에서 동일 검증·프로드 키→프로젝트 정합·실클릭 후 `cta_id` breakdown.
  - Acceptance: 14 cta_id 모두 PostHog 7d 데이터에 non-zero, locale 분해 가능
  - Verify: pnpm verify + `tests/unit/marketing-cta-id-stable-values.test.ts` + `tests/unit/marketing-cta-instrumentation.test.ts` PASS + PostHog dashboard segment by cta_id
  - Refs: docs/adr/ADR-013-marketing-cta-instrumentation-phase-1.md, docs/adr/ADR-012-positioning-2026-q2-scenario-a-media-first.md

### Next INIT Queue (`#55` -> `#59`)

- [x] #55 `[INIT][P0] queue-triage-runner`
  - Owner: `MyungJin Ko`
  - Order: `1`
  - Status: `implemented_verified`
  - Goal: triage `draft/review_required` into deterministic AI review decisions (`auto_approve_candidate|needs_rewrite|hold_manual`).
  - Acceptance: `metadata.ai_review.latest` is persisted for triaged items.
  - Verify: `queue_triage` run + metadata query snapshot (`runId=3b622895-2cd0-450d-ac8c-1af814530a96`, `scanned=23`, `autoApproveCandidate=6`, `needsRewrite=5`, `holdManual=12`).
- [x] #56 `[INIT][P0] queue-auto-rewrite-pass`
  - Owner: `MyungJin Ko`
  - Order: `2`
  - Status: `implemented_verified`
  - Goal: rewrite items marked `needs_rewrite` and store gate-after evidence.
  - Acceptance: rewritten body + `metadata.ai_rewrite.latest.gate_after` exists.
  - Verify: rewrite run output + review gate regression tests (`runId=b8fab971-07f8-4d42-9387-b812fc1998d3`, `scanned=5`, `rewritten=5`, `gate_after recorded`).
- [x] #57 `[INIT][P0] auto-approval-policy-guard`
  - Owner: `MyungJin Ko`
  - Order: `3`
  - Status: `implemented_verified`
  - Goal: enforce hard policy so only safe high-confidence items auto-transition.
  - Acceptance: policy-denied items stay manual and include explicit deny reason.
  - Verify: policy tests + triage policy execution (`runId=925a18d8-12bd-46a7-8142-3c329e1786c1`, `autoApproved=6`, `policyDenied=0`, policy metadata persisted).
- [x] #58 `[INIT][P1] cursor-automation-queue-scenario`
  - Owner: `MyungJin Ko`
  - Order: `4`
  - Status: `implemented_verified`
  - Goal: add Cursor-first scheduled queue review scenario.
  - Acceptance: `scenario=queue_review_window&source=cursor` persists runs with expected sequence.
  - Verify: automation-run endpoint trigger + `content_runs` evidence (`scenario=queue_review_window`, sequence `queue_triage->queue_rewrite->review_gate`, run ids `41acb1c6..`, `bb2a1fce..`, `3e0db2ad..`).
- [x] #59 `[INIT][P1] admin-queue-audit-surface`
  - Owner: `MyungJin Ko`
  - Order: `5`
  - Status: `implemented_verified`
  - Goal: expose triage/rewrite decision signals in `/admin/content-queue`.
  - Acceptance: operator can see decision/confidence/rewrite status at row level.
  - Verify: admin UI rendering + i18n parity tests (`typecheck`, `messages-locale-parity`, `admin-i18n-hardcoded` all pass).

## Immediate Next Step

- **P0 stabilization (#49–#51):** `#51` gate51 **PASS** (see `reports/gate51-snapshots/2026-05-03-gate51-pass-multiday.json`). **Runs invariant (BUILD 2026-05-05):** [`reports/2026-05-05-runs-invariant-check.json`](reports/2026-05-05-runs-invariant-check.json) — `runsInvariant.status=PASS`, `maxConsecutiveUtcDaysWithScheduled=2`, `meetsSevenConsecutiveCalendarDays=false`, `scheduledDaysUtc`=`["2026-05-02","2026-05-03"]`. **콘텐츠 큐 에이전트 검토:** [`reports/content-queue-agent-review-2026-05-05.md`](reports/content-queue-agent-review-2026-05-05.md) · 집계 [`reports/content-queue-aggregate-2026-05-05.json`](reports/content-queue-aggregate-2026-05-05.json). **Prod 스모크:** `automation-run` + Vercel 토큰(로컬 `.env.local` 불일치 시 401 예상). **7 UTC일 스트릭:** 미달; operator 일별 `scheduled` 유지.
- **Follow-on:** After **7** consecutive UTC days with ≥1 `scheduled` `content_runs`, write new `reports/*-runs-invariant-check.json` (same schema as `2026-05-03` file) and [x] the runtime line; **or** automation-off one-liner in `tasks.md`.
- **GitHub #62 / #63 (Refs):** #62 — Phase 1 REFLECT + **Phase 2 partial:** `aria-current` + PostHog `elevate_dashboard_sidebar_nav_click` [`tests/unit/dashboard-sidebar-nav-analytics.test.ts`](../tests/unit/dashboard-sidebar-nav-analytics.test.ts). DoD 나머지(13→4~5, 전면 a11y). CREATIVE [`memory-bank/creative-dashboard-sidebar.md`](memory-bank/creative-dashboard-sidebar.md). #63 closed — CI `gstack:check`; [`reports/gstack-check-sample.log`](reports/gstack-check-sample.log).

## PLAN snapshot (2026-05-03)

**전제:** `activeContext.md` INIT · Vercel `CONTENT_OPS_AUTOMATION_TOKEN` · 선택적 `automation-auth` 리팩터.

| 항목 | 내용 |
|------|------|
| **복잡도** | **L1** — 운영·증거·Memory Bank 갱신. 저장소 코드 반영이 필요하면 **L2**(`pnpm verify`). |
| **최우선 목표** | SoT DB 기준 **연속 7 UTC일** `trigger_type=scheduled` ≥1건/일 **또는** `tasks.md`에 automation-off(일시·담당·사유) 명시. |
| **성공 기준** | `pnpm run content-ops:runs-invariant-check`에서 `runsInvariant.status=PASS` 유지 + `maxConsecutiveUtcDaysWithScheduled ≥ 7`(또는 off 명시) + 새 `reports/*-runs-invariant-check.json`·`tasks.md` 미해결 `[ ]` 정리. |
| **리스크** | 토큰·런타임 불일치 시 `401`/`skipped`; `CONTENT_OPS_AUTOMATION_RUNTIME`·`source=cursor` RUNBOOK 정합 필수. 게이트 조작·임계 하향 금지(activeContext § Non-Negotiable). |

**작업 분해 (순서)**

1. **배포:** Vercel env 변경 후 **재배포**로 런타임에 토큰 반영 확인.
2. **스모크:** prod `GET /api/content-ops/automation-run?scenario=daily_generation&source=cursor&token=…` — 401 아님(비밀은 로그/PR에 금지).
3. **스케줄 유지:** cursor-first 정책에 맞게 일별 `scheduled` 행 유입(크론/외부 스케줄 문서: `docs/features/RUNBOOK-content-ops.md`).
4. **증거:** SoT Supabase cred로 `pnpm run content-ops:runs-invariant-check` → JSON 스냅샷 규칙(`reports/2026-05-03-…`와 동일 스키마)으로 저장.
5. **Memory Bank:** `tasks.md` 해당 체크리스트·Immediate Next Step bullet 갱신; `progress.md`에 날짜·PASS 한 줄; `activeContext.md` Current State 스트릭 수·파일 경로 반영.
6. **코드 트랙 (미반영 시):** `automation-auth`·테스트 diff가 워킹트리에만 있으면 **BUILD**에서 `pnpm verify` 후 커밋·푸시. 범위 밖 리팩터 금지.
7. **병렬 제약 (SoT):** #60 시나리오 코멘트 전 **히어로/포지셔닝 PR 없음**; #62 나머지는 `creative-dashboard-sidebar.md` CREATIVE 갱신 후 별 BUILD.

**검증 명령**

- `pnpm run content-ops:runs-invariant-check` (필수)
- 필요 시 `pnpm run content-ops:gate-check` (퍼블리시 경로 의심 시만)
- 코드 변경 시 `pnpm verify`

**다음 모드:** 운영 중심이면 **블록 D**(`docs/AI_EXPERT_PROMPTS.md`)로 게이트/스크립트 실행; 코드 ship 포함 시 **블록 B** 후 BUILD → REFLECT.

- [x] Create P0 stabilization tickets (#49-#51) with acceptance/verification.
- [x] Create P1 stabilization tickets (#52-#54) with P0 dependency.
- [x] Capture pre-fix baseline snapshot for publish failure, low_novelty, citation coverage.
- [x] Set concrete run order/owner: #49 -> #50 -> #51 (Owner: MyungJin Ko).
- [x] Start implementation in order: #49 -> #50 -> #51.
- [x] Observe #49 24h operational decay gate and record pass/fail.
  - Latest check (2026-05-02): `PASS` (`resend_not_configured=0`, failed24 <= failedPrevious24).
- [x] Re-run 24h observation after remediation and confirm decay trend.
  - Recheck (2026-05-02 latest): `PASS` (strict 24h decay satisfied after old failures aged out).
- [x] Bring publication fail ratio under `<20%` and keep retry waste low over consecutive daily windows.
  - Gate-check result (2026-05-02 latest): `gate50=PASS` (`failRatio24=0`, `retryExhausted24=0`).
- [x] Capture second-day novelty trend to confirm `low_novelty` and blog review_required movement.
  - Latest check (2026-05-03): `PASS` — `generatedAt=2026-05-03T07:39:27.547Z`, `pnpm run content-ops:gate51-trend-check`, `decisionReason=latest daily trend improved for low_novelty and blog review_required ratio`, `trend` buckets=2 (`2026-05-01` → `2026-05-03`). Snapshot: `reports/gate51-snapshots/2026-05-03-gate51-pass-multiday.json`. Prior `PENDING`: `2026-05-03-build-gate51.json` (single-day bucket).
- [ ] Resolve runtime-source alignment (`cursor` vs `vercel-cron`) and confirm first `scheduled` run is persisted in `content_runs.trigger_type`.
  - Evidence: first `scheduled` rows persisted (`source=cursor` success + `source=vercel-cron` mismatch failure) on 2026-05-02.
  - **Invariant snapshot (2026-05-03):** `pnpm run content-ops:runs-invariant-check` at `2026-05-03T07:45:52.536Z` → `runsInvariant.status=PASS`, `heartbeat.level=green`, 168h window `scheduled=9` / `manual=64`, `scheduledByAutomationSource` `{cursor:8,vercel-cron:1}`, `scheduledWithoutAutomationSource=0` (alignment: no scheduled row missing `metadata.automation_source`). File: `reports/2026-05-03-runs-invariant-check.json`.
  - **Invariant recheck (2026-05-03 UTC):** `pnpm run content-ops:runs-invariant-check` → **PASS** @ `generatedAt=2026-05-03T09:34:49.631Z`; evidence: [`reports/2026-05-03-runs-invariant-recheck.json`](../reports/2026-05-03-runs-invariant-recheck.json) (`maxConsecutiveUtcDaysWithScheduled=2`). **Prod GET smoke (elevate.ai.kr, token from local env):** **HTTP 401** — Vercel에 둔 값과 **동일한** 토큰으로 재시도할 것(로컬·운영 불일치 시 정상).
  - **Prod manual trigger (ops):** `curl`/브라우저는 **Vercel에 설정한 토큰**과 동일한 `token=` 사용(로컬 `.env.local`과 다를 수 있음). 재배포 후에도 401이면 값·공백·환경(Production) 재확인.
  - **7 consecutive UTC days:** `maxConsecutiveUtcDaysWithScheduled=2` — **does not yet** meet the 7-day bar; **Remaining:** daily `scheduled` through **`2026-05-08` UTC** (streak from `2026-05-02`) on SoT DB **or** explicit **automation-off** (date + owner + reason) in this checklist **or** new evidence JSON when ≥7.
- [x] Lock executor strategy before `#53`: Cursor Cloud Agent first, Vercel cron emergency fallback only.
- [x] Start INIT queue automation implementation in order: `#55 -> #56 -> #57 -> #58 -> #59`.
- [x] Fix sample blog post leak to production (2026-05-02 Claude audit, reports/2026-05-02-claude-audit.md §0 #1 / §3.2 D).

- **Positioning / #60 (Scenario A):** in-tree ADR [`docs/adr/ADR-012-positioning-2026-q2-scenario-a-media-first.md`](docs/adr/ADR-012-positioning-2026-q2-scenario-a-media-first.md) — GTM media-first vs Prompt Studio **product** narrative layered; PostHog mapping table; Phase 1 morning-ops strip = Supabase-only (implemented: `/admin/morning-ops` funnel scoreboard). **#60** retract/reframe comment: https://github.com/plancy-dev/elevate/issues/60#issuecomment-4365916803
- **Morning-ops Phase 2 (backlog):** PostHog funnel chips / HogQL or export mirror for scoreboard — explicit project API key env, rate limits, security review (out of scope for Phase 1).

**Reference (automation maturity):** `reports/automation-three-pillars-gap-analysis-2026-05-03.md` — service / newsletter / blog pillars: gap list and remediation plan.  
**Reference (prioritized work):** `reports/prioritized-backlog-expert-2026-05-03.md` — P0–P3 backlog and sprint-shaped order.  
**Reference (expert session prompts):** `docs/AI_EXPERT_PROMPTS.md` — Memory Bank 강제 로드 + 복붙 블록 A~D.

## Stabilization Gate Evidence Contract (`#49/#50/#51`)

- Use `pnpm run content-ops:gate-check` as the primary gate snapshot command.
- Gate `PASS` requires:
  - `status=PASS` from gate checker output,
  - one mandatory evidence line in task/progress format: `gate=<id> status=PASS reason=<decision_reason> evidence=<key metrics>`.
- Gate `PENDING` must keep issue open and include:
  - current blocker metric,
  - next recheck timebox (`strict 24h` or `multi-day trend`).
- Gate `FAIL` requires immediate remediation action item in the same update block.
- Do not close issue comment threads without attaching the latest gate checker timestamp and window bounds.

## Exit Criteria

- [x] All INIT issues (#38-#47) are closed with explicit rationale.
- [x] P0 stabilization issues (#49-#51) complete with verified metric movement.
- [x] P1 stabilization issues (#52-#54) complete with operational action loop.
- [x] Re-audit report after one business-day cycle is recorded (`reports/reaudit-post-cycle-2026-05-03.md`, 2026-05-03 UTC).
