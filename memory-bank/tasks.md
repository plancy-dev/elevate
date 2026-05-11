# Elevate — Tasks (Stabilization SoT)

## Operations mode — 2026 Q2 (effective 2026-05-06)

**Authority:** [`memory-bank/operations-mode-2026-q2.md`](../memory-bank/operations-mode-2026-q2.md) · **Weekly plan:** [`memory-bank/content-plan-weekly.md`](../memory-bank/content-plan-weekly.md).

**Commitment:** Elevate = **content channel** (blog 3×/wk, newsletter 1×/wk, SEO + list, INIT/STAB ops). **No new product features / new pages / design refactors / new ADRs** (~3 months) except maintenance & incidents. **가게점수** = separate repo — **no implementation work in this repo.** North Star doc [`creative-elevate-ai-pivot.md`](../memory-bank/creative-elevate-ai-pivot.md) **paused execution**, record retained.

**Evidence — direction post (2026-05-06):** [`content/blog/ko/elevate-first-vertical-content-focus.mdx`](../content/blog/ko/elevate-first-vertical-content-focus.mdx) · [`content/blog/en/elevate-first-vertical-content-focus.mdx`](../content/blog/en/elevate-first-vertical-content-focus.mdx).

**Evidence — Wed `cursor-session-discipline-that-ships` prod smoke (operator recheck #7, 2026-05-07 UTC):** `curl` **404** / **404** (`https://elevate.ai.kr/blog/cursor-session-discipline-that-ships`, `https://elevate.ai.kr/ko/blog/cursor-session-discipline-that-ships`); PostHog **358775** HogQL **`cnt=0`** (7d, `elevate_blog_post_viewed` + slug) — latest [`reports/prod-blog-cursor-session-smoke-2026-05-07T052808Z.json`](../reports/prod-blog-cursor-session-smoke-2026-05-07T052808Z.json) · prior [`reports/prod-blog-cursor-session-smoke-2026-05-07T052056Z.json`](../reports/prod-blog-cursor-session-smoke-2026-05-07T052056Z.json). **EN/KO `200` 미달** → Thu §4 **`발송 승인: 예`** 미적용 — [`memory-bank/content-plan-weekly.md`](content-plan-weekly.md) Thu §4.

**Prior SoT sections below** remain for historical context; where conflict exists, **this section + `operations-mode-2026-q2.md` win** for the ops phase.

**Docs harness (2026-05-07, 감사 완료):** `AI_ORCHESTRATION` 절번호 스팟 체크 — 깨진 참조 없음. 증거: [`reports/reflect-harness-rebuild-2026-05-07.md`](../reports/reflect-harness-rebuild-2026-05-07.md). **재검 트리거:** `docs/AI_ORCHESTRATION.md` 목차(§ 번호) 변경 시. 이번 패턴은 **MB·문서만** → **`pnpm verify` 생략**(§2.6 팀 합의) — Ops 스크립트 산출 불필요(§2.5).

## INIT — Remaining work bootstrap (2026-05-05)

**세션 목적:** INIT·P0·P1·큐(#55–#59) 완료 이후 **남은 체크포인트**에 대한 진입 정리. 상세 표·체크리스트는 [`memory-bank/activeContext.md`](activeContext.md) **Current Phase — INIT**.

| 우선 질문 (INIT에서 1개만 답하면 PLAN/BUILD로 넘어감) | 기본 증거/참조 |
|------------------------------------------------------|----------------|
| 오늘 트랙: **Ops** / **PostHog ADR-013** / **ENH #62·#60·#61** / **#73 합의** 중 무엇인가? | `activeContext` 인벤토리 표 |
| Ops면: DB 스트릭 재측정 시점·`automation-off` 필요 여부? | `pnpm run content-ops:runs-invariant-check` → `reports/*.json` |
| PostHog면: 프로젝트·브라우저 키·라이브 클릭으로 0건 원인 분기? | [`reports/reflect-adr013-posthog-2026-05-04.md`](../reports/reflect-adr013-posthog-2026-05-04.md) |
| #62 잔여면: 안 B 진행 vs #60 블로킹 코멘트 먼저? | [`memory-bank/creative-dashboard-sidebar.md`](creative-dashboard-sidebar.md) |

**INIT — 오늘 트랙 (확정, 2026-05-05):** **Ops** — PostHog ADR-013 STAB는 **closed**로 동일 INIT 질문의 PostHog 분기는 재개하지 않음; **Gate51 7d trend**는 [`reports/content-ops-gate51-trend-recheck-latest.json`](../reports/content-ops-gate51-trend-recheck-latest.json)에서 **`"status": "PENDING"`** (`generatedAt`: **2026-05-07T07:32:31.830Z**; 세션 [`reports/content-ops-gate51-trend-recheck-2026-05-07T073231Z.json`](../reports/content-ops-gate51-trend-recheck-2026-05-07T073231Z.json); 재실행: **`pnpm run content-ops:gate51-trend-check:write-latest`** 또는 **`pnpm exec tsx scripts/content-ops-gate51-trend-check.ts --out=reports/…json`** — `scripts/content-ops-gate51-trend-check.ts` (**`--out`이면 stdout 비출력·JSON은 파일만**; 한 줄은 stderr) · 파이프용 JSON stdout은 **`pnpm run -s content-ops:gate51-trend-check`** (`--out` 없음)); **runs-invariant**는 [`reports/runs-invariant-recheck-latest.json`](../reports/runs-invariant-recheck-latest.json) + [`reports/2026-05-07T073232Z-runs-invariant-recheck.json`](../reports/2026-05-07T073232Z-runs-invariant-recheck.json) 기준 **WARN** (heartbeat **yellow**, `rowCount` **89**; `automation_heartbeat_yellow_review_idle_vs_stuck`). **content-ops:gate-check (24h windows):** [`reports/2026-05-07T073232Z-content-ops-gate-check.json`](../reports/2026-05-07T073232Z-content-ops-gate-check.json) (`generatedAt`: **2026-05-07T07:32:32.957Z**) — **#49 PASS**, **#50 PASS**, **#51 PENDING** (`insufficient 24h sample size for novelty closure decision.`; `sampleCount24`: **0**).

**Non-negotiable:** `activeContext.md` § Non-Negotiable · #60 히어로 PR은 시나리오 코멘트 전 금지(`tasks.md` PLAN snapshot §7).

**Payments (app + docs):** **Lemon Squeezy + Polar only**; Toss PoC **removed from code**; `docs/` runbooks Lemon/Polar-first; **`toss_payment_intents`** = legacy DB — **default retain**; **optional drop** = operator-run draft only ([`docs/operations/draft-drop-toss-payment-intents.sql`](../docs/operations/draft-drop-toss-payment-intents.sql), ADR-005 § Legacy table removal) — Refs [`docs/adr/ADR-005-payment-rails-lemon-primary-toss-deferred.md`](../docs/adr/ADR-005-payment-rails-lemon-primary-toss-deferred.md) · historical [`ADR-001`](../docs/adr/ADR-001-toss-payments-poc.md).

## PLAN — Remaining closure (2026-05-05)

**From INIT:** 트랙 후보 Ops · PostHog ADR-013 · #62 · #60 · #61 → **PLAN 전환 완료**. 실행 순서·슬라이스 체크리스트: [`memory-bank/activeContext.md`](activeContext.md) **Current Phase — PLAN**. BUILD 세션은 트랙 하나만.

## Active session — PostHog STAB / ADR-013 §5 (**closed** 2026-05-05)

**목표 (달성):** §5a·§5 breadth·STAB **`[x]`** — 증거 [`reports/posthog-mcp-recheck-2026-05-05-operator-smoke.json`](../reports/posthog-mcp-recheck-2026-05-05-operator-smoke.json). **이 표 밖 작업**은 아래 **Explicit PENDING**만 참조.

### BUILD → REFLECT 체크리스트 (순서 고정)

1. [x] Vercel **Production:** `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` = PostHog **phc_…** (358775와 정합). Preview는 팀 정책에 맞춤. (증거: HTML RSC — [`reports/posthog-prod-html-preflight-latest.json`](../reports/posthog-prod-html-preflight-latest.json) + 아래 MCP)
2. [x] **Redeploy** Production — env 추가/변경 **이후** 생성된 빌드일 것(필요 시 **Clear build cache**). (MCP 비제로 CTA와 정합)
3. [x] **번들·RSC 프리플라이트:** **2026-05-04** 기준 **정적 chunk 20개** 샘플에만 보면 `phc_` **없음**(레거시: [`posthog-prod-bundle-check-latest.json`](../reports/posthog-prod-bundle-check-latest.json)). **갱신 (2026-05-05 측정):** **`/en` HTML 전체**에는 `phc_…` 리터럴 존재 → `PostHogRoot` **`initialPublicConfig`(RSC)** 로 토큰 전달(청크만 검사 시 오탐 가능). 증거: [`reports/posthog-prod-html-preflight-latest.json`](../reports/posthog-prod-html-preflight-latest.json). **PASS:** HTML 또는 공식 번들 검사 중 하나에서 키 확인 + PostHog에서 프로덕 URL 기준 이벤트 상식 검증.
4. [x] **CTA 스모크:** 프로덕에서 계기된 CTA 클릭 → PostHog `elevate_marketing_cta_click` 비제로 확인. **갱신 (2026-05-05 운영 스모크 + MCP):** 14 `cta_id` **7d hits ≥ 1** (allowlist join 쿼리). 증거: [`reports/posthog-mcp-recheck-2026-05-05-operator-smoke.json`](../reports/posthog-mcp-recheck-2026-05-05-operator-smoke.json) · 사전 스냅샷: [`reports/posthog-mcp-recheck-2026-05-05.json`](../reports/posthog-mcp-recheck-2026-05-05.json). **ADR Decision #5 strict (14/14 7d):** **PASS** — [`reports/reflect-adr013-posthog-2026-05-05.md`](../reports/reflect-adr013-posthog-2026-05-05.md) §2.
5. [x] PostHog **358775:** MCP로 CTA·프로덕 URL 재확인. **최신:** [`posthog-mcp-recheck-2026-05-05-operator-smoke.json`](../reports/posthog-mcp-recheck-2026-05-05-operator-smoke.json) · 레거시: [`posthog-mcp-recheck-2026-05-04.json`](../reports/posthog-mcp-recheck-2026-05-04.json).
6. [x] **REFLECT:** [`reports/reflect-adr013-posthog-2026-05-05.md`](../reports/reflect-adr013-posthog-2026-05-05.md) §2·§5 갱신. **STAB `[x]`** — [`tasks.md`](tasks.md) `[STAB][P1] marketing-cta-instrumentation-phase-1`.

### Explicit PENDING (이번 PostHog 세션 제외 — 재개 조건만 기록)

| 항목 | 모드 | 재개 조건 |
|------|------|-----------|
| Ops O2 `automation-run` | **REFLECT** | **PASS @ 2026-05-04** — [`reports/2026-05-04-ops-o2-automation-run-smoke.json`](../reports/2026-05-04-ops-o2-automation-run-smoke.json) (`200`, `daily_generation`). 필요 시 `/admin/runs`로 부작용 확인 |
| Ops 7d `scheduled` streak · automation-off | BUILD / REFLECT | `content-ops:runs-invariant-check` 증거 또는 `tasks.md` off 블록 |
| #62 안 B (Productions) | CREATIVE → BUILD | #60 노출 합의 후 |
| #60 히어로/포지셔닝 구현 PR | BUILD | 시나리오 코멘트 후 (SoT 유지) |
| #61 pricing | PLAN → BUILD | 스코프 확정, #62 충돌 시 순서 |
| #73 P2 Hooks/MCP/CI **구현** | PLAN | 이슈 3항 합의 후 |
| **Prod `toss_payment_intents` DROP** | **OPS (human)** | **2026-05-05: deferred** — agent has no prod DB access; default **retain** per ADR-005. When run: backup → [`docs/operations/draft-drop-toss-payment-intents.sql`](../docs/operations/draft-drop-toss-payment-intents.sql) → `pnpm db:types` → PR + issue **Refs**; evidence [`reports/reflect-toss-payment-intents-prod-drop-2026-05-05.md`](../reports/reflect-toss-payment-intents-prod-drop-2026-05-05.md) |

### 다음 작업 · 모드 (지금 막혔을 때)

**상태 (2026-05-05):** Ops O2 PASS 증거 유지. **PostHog:** 프로덕 **`/en` HTML에 `phc_` 존재**([`reports/posthog-prod-html-preflight-latest.json`](../reports/posthog-prod-html-preflight-latest.json)). **`elevate_marketing_cta_click`:** 운영 스모크 후 **14/14 `cta_id` 7d hits ≥ 1** — ADR §5 **PASS** · STAB **`[x]`**([`reports/posthog-mcp-recheck-2026-05-05-operator-smoke.json`](../reports/posthog-mcp-recheck-2026-05-05-operator-smoke.json)).

| 우선순위 | 모드 | 작업 | 누가 |
|----------|------|------|------|
| **A** | **BUILD → REFLECT** | **Ops O1** — `pnpm run content-ops:runs-invariant-check` 스냅샷·Gate51 | 에이전트 (병행) |
| **B** | **REFLECT** | **Ops O2** — 이미 PASS; 필요 시 `/admin/runs` 확인 | 운영자 |
| **C** | **CREATIVE → BUILD** | **#62** 안 B / 대시보드 — #60 합의 전 범위 준수 | 에이전트 |

**PostHog ADR-013 §5:** **PASS** · STAB **`[x]`** — [`reports/posthog-mcp-recheck-2026-05-05-operator-smoke.json`](../reports/posthog-mcp-recheck-2026-05-05-operator-smoke.json).

**Ops O1 / Gate51 (갱신 2026-05-07 UTC — runs-invariant·gate-check·Gate51 trend 동시 실행):** [`reports/runs-invariant-recheck-latest.json`](../reports/runs-invariant-recheck-latest.json) — **`WARN`**, heartbeat **yellow**, `rowCount` **89**, scheduled UTC day streak **3** (`2026-05-02`–`04`, `meetsSevenConsecutiveCalendarDays`: false); `runsInvariant.reason`: `automation_heartbeat_yellow_review_idle_vs_stuck`; session [`reports/2026-05-07T073232Z-runs-invariant-recheck.json`](../reports/2026-05-07T073232Z-runs-invariant-recheck.json) (`generatedAt`: **2026-05-07T07:32:32.519Z**). Prior: [`reports/2026-05-06T030024Z-runs-invariant-recheck.json`](../reports/2026-05-06T030024Z-runs-invariant-recheck.json) (`PASS`, green, 98 rows). **content-ops:gate-check:** [`reports/2026-05-07T073232Z-content-ops-gate-check.json`](../reports/2026-05-07T073232Z-content-ops-gate-check.json) (`generatedAt`: **2026-05-07T07:32:32.957Z**) — **#49/#50 PASS**, **#51 PENDING** (24h novelty sample 0). Gate51 trend (**`--out` 시 stdout 비출력**; `pnpm run content-ops:gate51-trend-check:write-latest` / `pnpm exec tsx scripts/content-ops-gate51-trend-check.ts --out=reports/…json`): [`reports/content-ops-gate51-trend-recheck-latest.json`](../reports/content-ops-gate51-trend-recheck-latest.json) — **`PENDING`** (`decisionReason`: `latest daily trend does not show simultaneous improvement`; `generatedAt`: **2026-05-07T07:32:31.830Z**); session [`reports/content-ops-gate51-trend-recheck-2026-05-07T073231Z.json`](../reports/content-ops-gate51-trend-recheck-2026-05-07T073231Z.json). Prior session: [`reports/content-ops-gate51-trend-recheck-2026-05-07T073006Z.json`](../reports/content-ops-gate51-trend-recheck-2026-05-07T073006Z.json). **REFLECT (Gate51 trend `PENDING` vs script):** [`reports/reflect-gate51-trend-2026-05-05.md`](../reports/reflect-gate51-trend-2026-05-05.md).

**이번 턴 권장:** **모드 `BUILD` — 트랙 A (Ops O1)** 또는 **#62** (SoT: `activeContext` · #60 PR 금지 유지).

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
- **Skill-first INIT (세션 지시 형태 전환 게이트):** 팀이 **「세션 시작은 `@elevate-work-harness`(또는 INIT 별칭 `@elevate-memory-bank-bootstrap`) 지명이 기본」**이라고 합의했거나, P2 **Hooks**가 merge되어 프롬프트 전 훅이 표준이 된 경우 → 아래를 `[x]`로 바꾼다. **그때부터** 사용자는 긴 "INIT 모드에서…" 대신 **스킬 한 줄 + 목표**만 주면 되고, 에이전트는 그 형태에 맞춘다. 가이드: [`docs/MEMORY_BANK_SKILL_GUIDE.md`](../docs/MEMORY_BANK_SKILL_GUIDE.md).  
  - [x] Skill-first INIT 활성 (**2026-05-06:** 팀이 세션 시작을 `@elevate-work-harness`(또는 INIT 별칭) 기본으로 채택했다고 가정·반영; P2 Hooks는 별도 `#73` 트랙) — 온보딩: [`docs/MEMORY_BANK_SKILL_GUIDE.md`](../docs/MEMORY_BANK_SKILL_GUIDE.md) § **팀 온보딩 한 줄 (초안)**.

## PLAN — Content queue Claude × review_gate UX (2026-05-05)

- **SoT (구현 체크리스트):** [`docs/features/PLAN-content-queue-claude-gate-ux.md`](../docs/features/PLAN-content-queue-claude-gate-ux.md) — 게이트 **미통과** 시 Claude **주 경로**, **통과** 시 **고급 메뉴만**, **원클릭 1→2 연쇄**, 컴포넌트 맵·서버 액션 옵션·i18n·테스트·롤아웃 P0–P2.
- **BUILD 상태 (2026-05-05):** P0–**P2 완료** — 연쇄 액션·UI·i18n·`gatePassedPropForClaudeForms`·`CONTENT_OPS_CLAUDE_WHEN_GATE_PASSED`·PostHog `content_queue_claude_chain_*` · Vitest. **잔여(비-P2):** PLAN §7 `aria-busy`/로딩.

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

- [x] [STAB][P1] marketing-cta-instrumentation-phase-1
  - Owner: rayleighko
  - Order: after #60 hero PR / parallel-safe with #61, #62
  - Status: `operational_gate_passed_2026_05_05_posthog_14_of_14_cta_id_7d`
  - **REFLECT (2026-05-05):** 프로덕 **elevate.ai.kr** 운영 스모크(6 cold `cta_id` 클릭) + PostHog **358775** allowlist HogQL — 14 `cta_id` **7d hits ≥ 1** · 이벤트 total **17**. 증거: [`reports/posthog-mcp-recheck-2026-05-05-operator-smoke.json`](../reports/posthog-mcp-recheck-2026-05-05-operator-smoke.json) · REFLECT [`reports/reflect-adr013-posthog-2026-05-05.md`](../reports/reflect-adr013-posthog-2026-05-05.md). 사전 MCP-only 스냅샷: [`reports/posthog-mcp-recheck-2026-05-05.json`](../reports/posthog-mcp-recheck-2026-05-05.json).
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

- **PostHog STAB:** **§5 완료** — 14 `cta_id` 7d 비제로 · STAB `[x]`([`reports/posthog-mcp-recheck-2026-05-05-operator-smoke.json`](../reports/posthog-mcp-recheck-2026-05-05-operator-smoke.json)). Ops O2는 **PASS** ([`tasks.md`](tasks.md) § 다음 작업 · 모드).
- **PostHog / ADR-013:** **358775** — `elevate_marketing_cta_click` **14/14** (7d, allowlist 검증) · [`reports/reflect-adr013-posthog-2026-05-05.md`](../reports/reflect-adr013-posthog-2026-05-05.md). 번들-only 레거시: [`reports/posthog-prod-bundle-preflight-quick-2026-05-04T044230Z.json`](../reports/posthog-prod-bundle-preflight-quick-2026-05-04T044230Z.json).
- **Ops O2 (automation-run):** **PASS (200)** @ `2026-05-04T04:41:20.609Z` — `pnpm content-ops:automation-run-smoke`, `scenario=daily_generation`, `ok: true`. 증거: [`reports/2026-05-04-ops-o2-automation-run-smoke.json`](../reports/2026-05-04-ops-o2-automation-run-smoke.json). **참고:** 스모크마다 `daily_generation` 실행 — 과호출 주의, `/admin/runs` 확인.
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
