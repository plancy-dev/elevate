# PLAN — AI Content Ops 2-Week MVP

## Objective

Ship a usable admin-operated content pipeline in 2 weeks:

1. generate drafts
2. review/approve in queue
3. publish blog and send newsletter
4. recover from failures

## Week 1 — Foundation

## Day 1-2: Data layer

- add migrations for:
  - `newsletter_subscribers`
  - `content_sources`
  - `content_items`
  - `content_item_source_map`
  - `content_runs`
  - `content_publications`
- apply baseline RLS policies (admin/service role oriented)
- regenerate DB types

## Day 3-4: Queue admin surface (minimum)

- implement `/admin/content-queue` list/detail with filters
- implement core actions:
  - `Approve`
  - `Reject`
  - `Request changes`
  - `Schedule`
  - `Publish now` (manual trigger stub allowed first)
- wire action logs to `content_runs` and audit events

## Day 5: Ingestion + draft generation baseline

- implement source registry (`/admin/news-sources`)
- add manual "Run ingest now" trigger
- ingest from trusted RSS/blog sources
- dedupe by hash and map to source attribution table
- generate draft records in `content_items` with `draft` status

## Week 2 — Operations

## Day 6-7: Review gate and publishing reliability

- implement quality gate checks before approval
- add channel records in `content_publications`
- implement publish worker logic:
  - blog channel publish
  - email channel send via Resend
- implement retries for `send_failed`

## Day 8-9: Run monitoring + subscribers admin

- implement `/admin/runs` for execution history and failures
- implement `/admin/subscribers` lifecycle actions:
  - subscribe/unsubscribe
  - frequency updates
  - bounce/complaint suppression
- add CSV export for operator workflow

## Day 10: Stabilization

- status transition hardening and guard checks
- failure path tests + manual smoke for publish pipeline
- verify migration/backfill scripts and rollback notes

## Transition Strategy (`waitlist_signups` -> `newsletter_subscribers`)

### Phase A: Parallel run

- keep `waitlist_signups` unchanged for lead capture and existing flows
- start all newsletter sends from `newsletter_subscribers` only

### Phase B: Backfill

- one-time backfill script from opt-in eligible waitlist entries
- mark source as `waitlist_backfill` in subscriber metadata

### Phase C: Funnel alignment

- update growth forms to write:
  - `waitlist_signups` (lead)
  - `newsletter_subscribers` (opt-in newsletter) when consent is explicit

### Phase D: Operational default

- `/admin/waitlist`: acquisition view
- `/admin/subscribers`: newsletter operations view
- remove any implicit assumptions that waitlist equals newsletter consent

## Risks and Mitigations

- **Source reliability drift:** keep source trust weights and fast disable switch.
- **Hallucinated claims:** require source attribution and reviewer approval.
- **Deliverability issues:** maintain suppression statuses (`bounced`, `complained`).
- **Operator overload:** support bulk approve/schedule for approved-safe states.

## Exit Criteria (end of week 2)

- operator can run ingest, review drafts, and publish from `/admin`
- failed sends can be retried with visible error reason
- unsubscribe status is respected immediately in send path
- content metadata is reusable for later ebook packaging workflows
