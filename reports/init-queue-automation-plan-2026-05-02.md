# INIT Queue Automation Plan (`#55~#59`) — 2026-05-02

## Goal

Reduce `draft/review_required` queue backlog by adding safe AI-assisted triage, rewrite, and approval automation on top of existing content-ops pipelines.

---

## #55 `[INIT][P0]` queue-triage-runner

### #55 Scope

- Add a new run type: `queue_triage`.
- Triage candidates from `content_items` where status is `draft` or `review_required`.
- Write deterministic triage decisions into metadata.

### #55 Target files

- `src/lib/content-ops/automation-config.ts`
- `src/lib/content-ops/run-orchestrator.ts`
- `src/lib/content-ops/pipeline-runner.ts`
- `src/app/api/content-ops/automation-run/route.ts`

### #55 Function-level implementation order

1. `automation-config.ts`
   - Extend `ContentOpsRunType` with `"queue_triage"`.
   - Keep existing sequence untouched for first release; triage will run by explicit scenario in `#58`.
2. `pipeline-runner.ts`
   - Add `runQueueTriagePipeline(runId: string)`.
   - Query candidate items (`draft`, `review_required`) sorted by `updated_at ASC`, bounded batch size.
   - Read latest review gate result (`metadata.review_gate.latest` or `metadata.reviewGate.latest`).
   - Persist `metadata.ai_review.latest` object:
     - `run_id`, `checked_at`, `decision`, `confidence`, `reasons`, `suggested_action`.
3. Decision conditions in `runQueueTriagePipeline`
   - `auto_approve_candidate`:
     - review gate passed
     - no block reasons (`possible_overcopy_detected`, `comparison_missing`, `counterargument_missing`)
     - quality score threshold met
   - `needs_rewrite`:
     - review gate failed with fixable reasons (`citation_coverage_low`, `body_too_short`, `low_novelty`, `low_relevance`)
   - `hold_manual`:
     - overcopy risk or conflicting signals
4. `run-orchestrator.ts`
   - Route `queue_triage` to `runQueueTriagePipeline`.
5. `automation-run/route.ts`
   - Accept `runType=queue_triage`.

### #55 Acceptance

- `queue_triage` run inserts a `content_runs` row and updates candidate item metadata only.
- No status transition is performed in `#55`.

### #55 Verify

- `pnpm run typecheck`
- `pnpm tsx scripts/content-ops-quality-monitor.ts`
- Manual query: ensure `metadata.ai_review.latest.decision` is populated.

---

## #56 `[INIT][P0]` queue-auto-rewrite-pass

### #56 Scope

- Add rewrite executor for triage candidates marked `needs_rewrite`.
- Re-run review gate after rewrite and store before/after signals.

### #56 Target files

- `src/lib/content-ops/pipeline-runner.ts`
- `src/lib/content-ops/packs/newsletter-prompt-pack.ts`
- `src/lib/content-ops/packs/blog-prompt-pack.ts`

### #56 Function-level implementation order

1. `pipeline-runner.ts`
   - Add `runQueueRewritePipeline(runId: string)`.
   - Select items where `metadata.ai_review.latest.decision = needs_rewrite`.
2. Add helper in `pipeline-runner.ts`
   - `buildRewriteDirective(reasons: string[], itemType: "blog" | "newsletter")`.
   - Map reason-to-instruction:
     - `citation_coverage_low` -> add inline anchors in body (non-appendix)
     - `body_too_short` -> add structured expansion blocks
     - `low_novelty` -> add contrast/counterpoint section
3. Apply rewrite
   - Regenerate body with pack-driven template guidance.
   - Save prior summary in `metadata.ai_rewrite.previous`.
4. Re-evaluate gate
   - Call `evaluateReviewGate` after rewrite.
   - Write `metadata.ai_rewrite.latest.gate_after`.

### #56 Acceptance

- At least one `needs_rewrite` item receives updated `body_markdown` and rewrite metadata.
- Gate-after result persists in metadata.

### #56 Verify

- `pnpm run typecheck`
- `pnpm exec vitest run tests/unit/review-gate.test.ts tests/unit/content-packs.test.ts`

---

## #57 `[INIT][P0]` auto-approval-policy-guard

### #57 Scope

- Add hard safety policy for automatic status transitions.
- Auto transitions allowed only under strict confidence + quality constraints.

### #57 Target files

- `src/lib/content-ops/pipeline-runner.ts`
- `src/lib/content-ops/alerting.ts`
- `tests/unit/content-ops-config-stop-policy.test.ts` (or new policy test file)

### #57 Function-level implementation order

1. Add policy helper
   - `resolveAutoApprovalPolicy(input)` returns `{ allowed, reason, nextStatus }`.
2. Policy conditions
   - Allow only if:
     - triage decision is `auto_approve_candidate`
     - confidence >= threshold
     - gate passed and quality score >= threshold
     - no hard-block reasons (`possible_overcopy_detected`, structural-missing reasons)
   - Else force `hold_manual`.
3. Transition behavior
   - if `allowed`: set status to `approved` (or `scheduled` when schedule mode is enabled)
   - else: keep `review_required`
4. Alerting integration
   - Emit structured warning when auto-approve denied by policy repeatedly.

### #57 Acceptance

- No item bypasses policy.
- Denied decisions are traceable in metadata + alert payload.

### #57 Verify

- `pnpm run typecheck`
- `pnpm exec vitest run tests/unit/content-ops-config-stop-policy.test.ts tests/unit/content-ops-alerting.test.ts`

---

## #58 `[INIT][P1]` cursor-automation-queue-scenario

### #58 Scope

- Add queue automation scenario for Cursor-triggered scheduled runs.
- Keep Cursor-first runtime policy.

### #58 Target files

- `src/app/api/content-ops/automation-run/route.ts`
- `src/lib/content-ops/automation-config.ts`
- `docs/features/RUNBOOK-content-ops.md`

### #58 Function-level implementation order

1. Add scenario in route
   - `scenario=queue_review_window`.
   - sequence: `queue_triage -> queue_rewrite (optional) -> review_gate`.
2. Runtime constraints
   - keep `source=cursor` default
   - reject mismatch via existing runtime mismatch guard.
3. Runbook update
   - document when to run queue scenario and expected outputs.

### #58 Acceptance

- Scheduled API call with `scenario=queue_review_window&source=cursor` persists runs.
- Scenario does not trigger direct publish.

### #58 Verify

- `pnpm run typecheck`
- Trigger endpoint in local/preview and inspect `content_runs`.

---

## #59 `[INIT][P1]` admin-queue-audit-surface

### #59 Scope

- Expose AI triage/rewrite decisions in admin queue UI for operator approval.
- Provide deterministic operator actions for backlog burn-down.

### #59 Target files

- `src/app/(admin)/admin/content-queue/page.tsx`
- `messages/en.json`, `messages/ko.json`, `messages/ja.json`, `messages/zh-CN.json`, `messages/zh-TW.json`

### #59 Function-level implementation order

1. Add metadata readers
   - parse `metadata.ai_review.latest` and `metadata.ai_rewrite.latest`.
2. Add new UI cells/badges
   - decision badge (`auto_approve_candidate`, `needs_rewrite`, `hold_manual`)
   - confidence and last rewrite indicator
3. Action guard
   - show operator recommendation button set based on decision.

### #59 Acceptance

- Operators can see why each item is blocked/ready.
- Queue triage signals are visible without opening raw metadata.

### #59 Verify

- `pnpm run typecheck`
- `pnpm exec vitest run tests/unit/messages-locale-parity.test.ts tests/unit/admin-i18n-hardcoded.test.ts`

---

## Execution Order

1. `#55` (triage metadata)
2. `#56` (rewrite pass)
3. `#57` (policy guard)
4. `#58` (cursor scenario)
5. `#59` (admin observability)

## Done Criteria for This INIT Prep

- Issue scope, acceptance, and verify commands fixed for `#55~#59`.
- Function/condition-level order is implementation-ready.
- Memory bank queue is synchronized to the new order.
