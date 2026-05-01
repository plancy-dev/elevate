# RUNBOOK: Content Ops

## Scope

This runbook covers daily operation of the content pipeline:

- `ingest` -> `draft_generate` -> `review_gate` -> `publish`
- Admin dashboards: `/admin/content-queue`, `/admin/runs`, `/admin/news-sources`, `/admin/subscribers`

## Daily Operation Order

1. Open `/admin/runs` and check latest run summary cards.
2. Run `ingest` manually if no scheduled automation has run in the last 24h.
3. Run `draft_generate`.
4. Run `review_gate`.
5. Open `/admin/content-queue` and review items marked `review_required`.
6. Approve/schedule items for publish.
7. Run `publish` (or `Retry failed only` if failures already exist).
8. Confirm result badges and failure tooltips in `/admin/runs`.

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

## Minimum Checklist

- [ ] `ingest` completed today (or intentionally skipped)
- [ ] `draft_generate` completed today
- [ ] `review_gate` completed and failures triaged
- [ ] `publish` completed (or retry scheduled)
- [ ] `/admin/runs` top failure reason acknowledged
- [ ] No repeated `resend_not_configured` warnings
- [ ] No stale `send_failed` item older than 24h without owner

## CI / Script Operations

Dry-run scripts for CI safety:

- `pnpm content-ops:smoke:dry-run`
- `pnpm content-ops:cleanup:dry-run`

Live scripts (write mode):

- `pnpm content-ops:smoke`
- `pnpm content-ops:cleanup`
