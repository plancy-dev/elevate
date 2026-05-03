# Elevate — Tasks (Stabilization SoT)

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
- [ ] #51 `[STAB][P0] novelty-recovery-pass`
  - Owner: `MyungJin Ko`
  - Order: `3` (starts after #49/#50 publish-path stabilization)
  - Status: `operational_gate_pending_multiday_trend_required`
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
- [ ] Capture second-day novelty trend to confirm `low_novelty` and blog review_required movement.
  - Latest check (2026-05-03): `PENDING` (`pnpm run content-ops:gate51-trend-check` — **≥2 day buckets required**; currently only one day present, so **statistical closure of #51 is not possible yet**).
- [ ] Resolve runtime-source alignment (`cursor` vs `vercel-cron`) and confirm first `scheduled` run is persisted in `content_runs.trigger_type`.
  - Evidence: first `scheduled` rows persisted (`source=cursor` success + `source=vercel-cron` mismatch failure) on 2026-05-02.
- [x] Lock executor strategy before `#53`: Cursor Cloud Agent first, Vercel cron emergency fallback only.
- [x] Start INIT queue automation implementation in order: `#55 -> #56 -> #57 -> #58 -> #59`.
- [x] Fix sample blog post leak to production (2026-05-02 Claude audit, reports/2026-05-02-claude-audit.md §0 #1 / §3.2 D).

**Reference (automation maturity):** `reports/automation-three-pillars-gap-analysis-2026-05-03.md` — service / newsletter / blog pillars: gap list and remediation plan.  
**Reference (prioritized work):** `reports/prioritized-backlog-expert-2026-05-03.md` — P0–P3 backlog and sprint-shaped order.

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
- [ ] P0 stabilization issues (#49-#51) complete with verified metric movement.
- [x] P1 stabilization issues (#52-#54) complete with operational action loop.
- [x] Re-audit report after one business-day cycle is recorded (`reports/reaudit-post-cycle-2026-05-03.md`, 2026-05-03 UTC).
