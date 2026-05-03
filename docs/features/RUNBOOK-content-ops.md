# RUNBOOK: Content Ops

## Scope

This runbook covers daily operation of the content pipeline:

- `ingest` -> `draft_generate` -> `review_gate` -> `publish`
- Admin dashboards: `/admin/content-queue`, `/admin/runs`, `/admin/news-sources`, `/admin/subscribers`

## Automation Runtime Policy (Cursor-first)

- Primary executor: `cursor` (`CONTENT_OPS_AUTOMATION_RUNTIME=cursor`)
- Emergency fallback executor: `vercel-cron` (`CONTENT_OPS_AUTOMATION_RUNTIME=vercel-cron`)
- Trigger endpoint: `/api/content-ops/automation-run`
- Source contract:
  - normal operation: `source=cursor`
  - fallback incident mode only: `source=vercel-cron`

Policy notes:

- Default operation is Cursor Cloud Agent-first, not dual-active.
- Keep `CONTENT_OPS_AUTOMATION_RUNTIME=cursor` unless there is a verified Cursor runtime incident.
- After any fallback window, revert runtime to `cursor` immediately.

**Vercel Project env:** If `CONTENT_OPS_AUTOMATION_RUNTIME` does not appear in the dashboard, the app still defaults to **`cursor`** (anything other than the exact string `vercel-cron` resolves to cursor). **Recommended:** create the variable explicitly (`cursor`) so preflight checks and on-call runbooks match production config. While runtime is `cursor`, `vercel.json` schedules that call `source=vercel-cron` will return `skipped: true` (`runtime_secret_mismatch:*`) by design — that is the emergency-only path, not the primary scheduler.

**Vercel cron “noise” (expected):** With `CONTENT_OPS_AUTOMATION_RUNTIME=cursor`, Mon–Fri crons still invoke `source=vercel-cron`; each hit records a **skipped** run (`runtime_secret_mismatch:cursor:source=vercel-cron`) in `content_runs`. That can appear in `scheduledByAutomationSource` breakdowns as a small `vercel-cron` count. **Treat as normal** unless you intended dual-active execution. Remediation options (PLAN): leave as-is (dormant fallback), remove cron entries until an incident, or temporarily flip runtime to `vercel-cron` per incident policy. **Do not** page on mismatch alone when cursor-first is the declared policy.

Required secrets/env:

- `CONTENT_OPS_AUTOMATION_TOKEN` (API trigger token for non-Vercel callers)
- `CONTENT_OPS_ALERT_WEBHOOK_URL` (optional alert hook)
- `CURSOR_API_KEY` (for Cursor automation workflows)

US ET schedule source-of-truth:

- Daily generation: 08:30 `ingest`, 08:40 `draft_generate`, 08:50 `review_gate`
- Publish window: 11:00 `publish`
- Retry window: 14:30 `publish_retry_failed`

Preflight checks before enabling scheduled runs:

1. Verify `CONTENT_OPS_AUTOMATION_RUNTIME=cursor`.
2. Verify caller sends `source=cursor`.
3. Verify `CONTENT_OPS_AUTOMATION_TOKEN` is present and current.
4. Confirm one `trigger_type=scheduled` run is persisted with:
   - `metadata.automation_source=cursor`
   - `metadata.runtime=cursor`
5. If mismatch alert appears (`runtime_secret_mismatch:*`), halt schedule and fix runtime/source first.

## Runs invariant and heartbeat

- **CLI snapshot:** `pnpm run content-ops:runs-invariant-check` — last 7d `content_runs` totals, `trigger_type` / `metadata.automation_source` for scheduled rows, and PASS/WARN/FAIL style verdict.
- **UI:** `/admin/morning-ops` includes an **Automation heartbeat** strip (green/yellow/red) from the same 7d window so operators can separate healthy idle from stale telemetry.

## Stabilization Gate Check (`#49/#50/#51`)

Primary command:

- `pnpm run content-ops:gate-check`

Output contract:

- JSON object with:
  - `gates.gate49`, `gates.gate50`, `gates.gate51`
  - each gate includes `status`, `decision_reason`, `evidence`
- Markdown summary with one-line verdicts per gate

Decision policy:

- `PASS`: eligible for issue close comment (attach evidence line and command timestamp)
- `PENDING`: keep issue open and set next recheck ETA
- `FAIL`: keep issue open and trigger remediation action loop immediately

Tuning knobs:

- `CONTENT_OPS_GATE50_FAIL_RATIO_TARGET_PERCENT`
  - default: `20`
  - gate50 pass condition: `failRatio24 < target`
- `CONTENT_OPS_QUEUE_AUTO_APPROVE_MIN_CONFIDENCE`
  - default: `0.8`
  - applied in queue auto-approval policy guard
- `CONTENT_OPS_QUEUE_AUTO_APPROVE_MIN_QUALITY_SCORE`
  - default: `16`
  - applied in queue triage + auto-approval policy guard

## Queue Review Scenario (Cursor-first)

Use queue review automation to process backlog safely before publish windows.

- Endpoint:
  - `GET /api/content-ops/automation-run?scenario=queue_review_window&source=cursor&token=...`
- Scenario sequence:
  - `queue_triage` -> `queue_rewrite` -> `review_gate`
- Expected behavior:
  - no direct publish/send action in this scenario
  - queue items are triaged/reworked and remain operator-visible in `/admin/content-queue`
- Runtime constraint:
  - only `source=cursor` in normal operation
  - if runtime mismatch is emitted, fix runtime/source alignment before retry

## Daily Operation Order

1. Open `/admin/runs` and check latest run summary cards.
2. Run `ingest` manually if no scheduled automation has run in the last 24h.
3. Run `draft_generate`.
4. Run `review_gate`.
5. Open `/admin/content-queue` and review items marked `review_required`.
6. Approve/schedule items for publish.
7. Run `publish` (or `Retry failed only` if failures already exist).
8. Confirm result badges and failure tooltips in `/admin/runs`.

## Multilingual Admin Smoke QA (Post-deploy)

Target screens:

- `/admin/subscribers`
- `/admin/news-sources`
- `/admin/runs`
- `/admin/content-queue`
- `/admin/content-quality`

Locales:

- `en`, `ko`, `ja`, `zh-CN`, `zh-TW`

Quick check procedure:

1. Sign in as admin on deployed environment.
2. Switch locale once per target locale (language selector or `NEXT_LOCALE` cookie).
3. On each target screen, verify:
   - page title/header is translated,
   - table column labels are translated,
   - button labels and status chips are translated,
   - no obvious fallback English remains.
4. Capture one screenshot per locale set (at minimum: `/admin/subscribers`, `/admin/content-quality`).
5. Log failures as `i18n_ui_gap` with path + locale + screenshot.

If authentication blocks automated checks, perform manual browser verification and attach evidence links/screenshots in the PR/deploy note.

## Incident Response Order

1. **Identify class**
   - `resend_not_configured`: Email provider config issue.
   - `newsletter_no_subscribers`: No active audience.
   - `rss_fetch_error:*`: Source fetch outage or parser error.
2. **Contain**
   - Stop repeated retries if `attempt_count` reached max.
   - Disable broken source in `/admin/news-sources` when needed.
3. **Recover**
   - Fix root cause (env var/source URL/subscriber status).
   - Use `Retry failed only` from `/admin/runs` or `/admin/content-queue`.
4. **Verify**
   - Ensure new run is `성공` or `부분실패` with expected warning only.
   - Confirm queue items move from `send_failed` to `published`.

## Newsletter Retry Policy Matrix

Email publication failures are mapped to a policy key and action so retry behavior is predictable:

| Failure class example | Policy key | Action | Delay |
| --- | --- | --- | --- |
| `Too many requests`, rate-limit style transient | `policy.rate_limit.delayed` | delayed retry | 30m |
| Unknown transient send failures | `policy.transient.delayed` | delayed retry | 30m |
| `resend_not_configured`, sender/domain mismatch | `policy.config.stop` | stop retry | - |
| `newsletter_no_subscribers` | `policy.no_subscribers.stop` | stop retry | - |
| `retry_exhausted` | `policy.exhausted.stop` | stop retry | - |
| `frequency_window_deferred` | `policy.frequency_window.delayed` | delayed to next window | 24h |

Recorded metadata fields (email publication row):

- `retry_policy_key`
- `retry_action`
- `retry.next_retry_at`

## Escalation Ownership / Response Window

- Primary owner: Content Ops on-call (admin operator)
- Secondary owner: Engineering on-call (automation reliability)

SLA:

- `review_required` queue item older than 24h: acknowledge within 4h
- alert webhook failure events: acknowledge within 1h
- repeated `resend_not_configured`: fix or disable publish window same business day

## Minimum Checklist

- [ ] `ingest` completed today (or intentionally skipped)
- [ ] `draft_generate` completed today
- [ ] `review_gate` completed and failures triaged
- [ ] `publish` completed (or retry scheduled)
- [ ] `/admin/runs` top failure reason acknowledged
- [ ] No repeated `resend_not_configured` warnings
- [ ] No stale `send_failed` item older than 24h without owner
- [ ] No `review_required` backlog over threshold without escalation note
- [ ] Admin locale smoke QA completed for `en`, `ko`, `ja`, `zh-CN`, `zh-TW`

## Content Quality Monitor Interpretation Guide

Use `/admin/content-quality` with these thresholds:

- `avg quality score`:
  - >= 18: healthy baseline
  - 14~17: watchlist (needs prompt/pack tuning)
  - < 14: investigate immediately
- `24h min quality`:
  - < 12: high-priority review for newest drafts
- `7d review_required` trend:
  - rising for 2+ consecutive days indicates pack drift or source relevance issue
- `7d send_failed`:
  - > 0 requires failure class breakdown and retry-window verification
- `Top Quality Issues (Fresh 24h only)`:
  - prioritize these over historical backlog when adjusting packs

Operational loop:

1. Identify top two recurring reasons (`low_novelty`, `low_relevance`, `body_too_short`, etc.).
2. Update pack templates/topic strategy in a versioned change.
3. Run one full cycle (`ingest` -> `draft_generate` -> `review_gate` -> `publish`).
4. Compare fresh 24h metrics before/after.
5. Keep changes only if `freshAvgQualityScore` improves and `freshReviewRequiredCount` does not regress.

### Delta window contract (Issue #38)

`/admin/content-quality` delta metrics use fixed non-overlapping windows:

- Current 24h: `[now-24h, now)`
- Previous 24h: `[now-48h, now-24h)`
- Current 7d: `[now-7d, now)`
- Previous 7d: `[now-14d, now-7d)`

Rules:

- Never mix current-window rows into previous-window aggregates.
- Window start is inclusive, end is exclusive (`>= start` and `< end`).
- Delta formula: `((current - previous) / previous) * 100`.
- Denominator-zero handling:
  - `previous = 0` and `current = 0` -> delta `0%`
  - `previous = 0` and `current > 0` -> delta `n/a` (undefined growth)

## CI / Script Operations

Dry-run scripts for CI safety:

- `pnpm content-ops:smoke:dry-run`
- `pnpm content-ops:cleanup:dry-run`

Live scripts (write mode):

- `pnpm content-ops:smoke`
- `pnpm content-ops:cleanup`

## Autoloop Operations (Cursor Automations Primary)

Autoloop objective:

- continuously validate repo health and content quality signals
- optionally merge only policy-safe PR candidates
- fail closed when any critical condition is violated

Execution modes:

- `rehearsal`: no merge/write actions, safe rehearsal
- `production`: bounded checks with optional low-risk auto-merge

Standard commands:

- Rehearsal:
  - `pnpm autoloop:rehearsal`
- Production (merge disabled):
  - `pnpm autoloop:production`
- Production (low-risk auto-merge enabled):
  - `pnpm autoloop:poc --mode=production --max-cycles=48 --max-hours=24 --interval-minutes=30 --required-secrets=CONTENT_OPS_AUTOMATION_TOKEN --merge-enabled=true`

Policy gate for automated merge:

- required label: `low-risk`
- base branch: `main`
- allowlist paths only:
  - `docs/**`
  - `messages/**`
  - `memory-bank/**`
  - `tests/unit/admin-i18n-hardcoded.test.ts`

### Cursor Automations schedule contract

Recommended schedule:

- rehearsal: once per day
- production: weekdays 2-4 times/day (bounded 30-60 minutes per invocation)

Each run should pass a unique run id:

- `--cursor-run-id=<automation_run_id>`

Concurrency guard:

- lock file path: `reports/autoloop/.lock`
- if lock exists, run must fail fast and report lock owner metadata

### Stop Conditions (Fail-Closed)

Hard stop:

- required check failure (`clean-tree`, `typecheck`, `test:i18n`)
- missing required secrets (default: `CONTENT_OPS_AUTOMATION_TOKEN` in production)
- policy/merge gate failure for candidate PR
- emergency stop switch file present (`reports/autoloop/.automerge-stop`)

Soft stop:

- optional quality checks fail (`content-packs`, `quality-monitor`)
- merge is disabled for that cycle and loop halts with warning report

### Emergency stop switch

To immediately pause merge-capable runs:

1. create file `reports/autoloop/.automerge-stop`
2. rerun or wait for next autoloop invocation (it will halt with stop reason)
3. remove the file only after issue triage is complete

### Report interpretation

Autoloop report path:

- `reports/autoloop/*.json`

Key report fields:

- `runMode`, `policyVersion`, `cursorRunId`
- `candidatePrs`, `mergedPrs`
- `stopReason`, `elapsedMs`
- `steps[]` with `ok/skipped/error`
