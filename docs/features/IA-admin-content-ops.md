# IA — `/admin` Content Ops

## Goal

Provide a practical operator interface for:

- reviewing generated content
- scheduling/publishing approved content
- managing ingestion sources
- tracking automation runs
- handling subscriber lifecycle

## Route Map

## 1) `/admin/content-queue`

Primary queue board for editorial operations.

### List view

- Columns: `type`, `title`, `status`, `scheduled_at`, `source_quality_score`, `updated_at`
- Filters:
  - `type`: `blog`, `newsletter`
  - `status`: `draft`, `review_required`, `approved`, `scheduled`, `publishing`, `published`, `send_failed`, `rejected`
  - date range (`updated_at`, `scheduled_at`)
  - reviewer (`reviewed_by`)
  - locale

### Item detail panel

- Content preview (summary + markdown body)
- Source attribution list (from `content_item_source_map`)
- Quality/fact-check signal
- Review notes history

### Actions

- `Approve`
- `Reject`
- `Request changes` (sets `review_required` + note)
- `Schedule`
- `Publish now`
- `Retry publish/send` (for failed states)
- `Duplicate as draft` (optional, phase 2)

## 2) `/admin/news-sources`

Source registry and weighting controls.

### List view

- Columns: `name`, `kind`, `is_active`, `trust_weight`, `fetch_interval_minutes`, `updated_at`
- Filters: active/inactive, kind, tags

### Actions

- `Add source`
- `Disable/Enable`
- `Edit trust weight`
- `Run ingest now` (manual trigger)
- `Preview latest entries` (read-only inspector)

## 3) `/admin/runs`

Automation run monitoring and operational recovery.

### List view

- Columns: `run_type`, `status`, `trigger_type`, `started_at`, `ended_at`, `error_summary`
- Filters: status, run type, date range

### Actions

- `Re-run`
- `View logs`
- `Cancel` (if currently running)
- `Retry failed unit` (phase 2, per-item)

## 4) `/admin/subscribers`

Subscriber lifecycle operations for newsletter.

### List view

- Columns: `email`, `status`, `frequency_pref`, `locale`, `consent_at`, `unsubscribe_at`, `source`
- Filters: status, frequency, locale, tags

### Actions

- `Add subscriber`
- `Mark unsubscribed`
- `Resubscribe`
- `Update preference`
- `Export CSV`
- `Suppress permanently` (for hard bounce/complaint)

## Shared Admin UX Contracts

- All destructive actions require confirmation modal with plain-language impact note.
- All status-changing actions emit an audit entry.
- Bulk actions allowed only for safe transitions:
  - `Approve selected`
  - `Schedule selected`
  - `Publish approved selected`
  - no bulk hard delete in MVP

## Status Transition Guards

- `draft` -> `review_required` (auto or manual)
- `review_required` -> `approved` only if:
  - at least one source link exists
  - title/body non-empty
  - review note required when overriding failed quality checks
- `approved` -> `scheduled` or `publishing`
- `publishing` -> `published` or `send_failed`
- `send_failed` -> `publishing` via retry

## Existing Route Integration Notes

- keep existing `/admin/waitlist` for lead capture management
- add `/admin/subscribers` for newsletter operations
- maintain existing access model from `src/app/(admin)/layout.tsx`
