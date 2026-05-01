# RUNBOOK: Content Ops

## Scope

This runbook covers daily operation of the content pipeline:

- `ingest` -> `draft_generate` -> `review_gate` -> `publish`
- Admin dashboards: `/admin/content-queue`, `/admin/runs`, `/admin/news-sources`, `/admin/subscribers`

## Automation Runtime (A/B)

- Primary runtime: `cursor` (`CONTENT_OPS_AUTOMATION_RUNTIME=cursor`)
- Fallback runtime: `vercel-cron` (`CONTENT_OPS_AUTOMATION_RUNTIME=vercel-cron`)
- Trigger endpoint: `/api/content-ops/automation-run`

Required secrets/env:

- `CONTENT_OPS_AUTOMATION_TOKEN` (API trigger token for non-Vercel callers)
- `CONTENT_OPS_ALERT_WEBHOOK_URL` (optional alert hook)
- `CURSOR_API_KEY` (for Cursor automation workflows)

US ET schedule source-of-truth:

- Daily generation: 08:30 `ingest`, 08:40 `draft_generate`, 08:50 `review_gate`
- Publish window: 11:00 `publish`
- Retry window: 14:30 `publish_retry_failed`

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

## CI / Script Operations

Dry-run scripts for CI safety:

- `pnpm content-ops:smoke:dry-run`
- `pnpm content-ops:cleanup:dry-run`

Live scripts (write mode):

- `pnpm content-ops:smoke`
- `pnpm content-ops:cleanup`
