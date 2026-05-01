# Content Ops E2E Validation Report (2026-05-01)

## Scope

Validation followed the execution order in `content-ops-e2e-verification-playbook`:

1. Preflight
2. Data seed
3. Generation (`ingest -> draft_generate -> review_gate`)
4. Approval-first publish
5. Failure and retry drill
6. Pack swap traceability

## Environment and Preflight

- Runtime: `cursor` (verified in `content-ops:smoke:dry-run`)
- ET schedule surfaced correctly in dry-run output
- Local secret status:
  - `NEXT_PUBLIC_SUPABASE_URL`: set
  - `SUPABASE_SERVICE_ROLE_KEY`: set
  - `RESEND_API_KEY`: set
  - `RESEND_FROM_EMAIL`: missing
  - `CONTENT_OPS_AUTOMATION_TOKEN`: missing

## Data Setup Evidence

- Active sources: `2`
  - `[SMOKE] HNRSS Frontpage` (`https://hnrss.org/frontpage`)
  - `[SMOKE] Broken RSS Fixture` (`https://example.invalid/rss`)
- Subscribed users: `4` (`en`, `ko`, `ja` included)

## Run IDs (Primary Verification Cycle)

- `ingest`: `c5df02fb-9c35-4f71-ae5b-7d1d1c71b601`
- `draft_generate`: `fcb2e458-ad5d-44d2-b847-a96611257adf`
- `review_gate`: `2b5755ab-ed9c-4e22-9cc7-ac8f7d06ed93`
- `publish` (publish window): `abd1dd53-dc1d-41fe-9e55-adb8420e51d2`
- `publish_retry_failed` (retry window): `11a2722d-bc21-44dd-bb9e-2f2f253c4a46`

## Pass/Fail by Goal

### 1) Generation Path from Real Sources

- **Pass**
- `ingest` scanned active sources and classified one broken source (`rss_fetch_error`)
- `draft_generate` created new newsletter/blog items
- `review_gate` wrote rubric metrics and reasons (e.g., `low_novelty`) into item metadata

### 2) Approval Gate Protection

- **Pass**
- Only a manually approved newsletter was eligible during publish test
- Unapproved `review_required` items remained queued

### 3) Publish Window Behavior

- **Pass with expected send failures**
- Approved item transitioned to `send_failed` because sender config was incomplete (`RESEND_FROM_EMAIL` missing)
- No evidence of unapproved item auto-publish

### 4) Failure Classification + Retry Policy

- **Pass**
- Failure classes observed:
  - `rss_fetch_error:*` (broken feed)
  - `resend_not_configured` / `retry_exhausted` (email path)
- Retry window processed failed newsletter items only
- Latest retry summary:
  - `processedCount: 10`
  - `failedCount: 10`
  - first failure: `[newsletter:...] retry_exhausted`

### 5) Pack-Swap Quality Validation

- **Pass**
- Contract change applied in `topic-strategy-pack`:
  - `TOPIC_STRATEGY_PACK_VERSION`: `v1.0.0 -> v1.0.1`
  - execution-advantage title/question/why-now patterns updated
- Before title:
  - `Daily AI Brief: Execution moat for AI-enabled teams (2026-05-01)`
- After title:
  - `Daily AI Brief: Operator-grade execution moat for AI-enabled teams (2026-05-01)`
- Traceability confirmed on generated items:
  - `metadata.generate.pack_versions.topicStrategy = v1.0.1`

## Queue Snapshot (End of Validation)

- `review_required`: 4
- `send_failed`: 10
- `published`: 1
- Top failure summary:
  - `warning:[newsletter:2db5ef7f-7df4-436f-9e92-7e4fb7bead24] retry_exhausted`

## Fixes Applied During Verification

- Resolved retry-window execution issue caused by DB `run_type` check constraint mismatch.
- `publish_retry_failed` now persists as `publish` in `content_runs` while keeping logical run intent in metadata:
  - `requested_run_type`
  - `persisted_run_type`

## Go/No-Go Decision

- **Decision: CONDITIONAL GO (staging/internal), NO-GO (production)**

Rationale:

- Core workflow behavior (ingest/generate/review/publish/retry/pack-swap traceability) is functioning.
- Production send path is not ready due to missing sender config and missing automation token.

## Top 3 Follow-up Actions

1. Set `RESEND_FROM_EMAIL` and `CONTENT_OPS_AUTOMATION_TOKEN` in runtime secrets, then re-run `publish_window` + `retry_window`.
2. Replace/remove invalid subscriber fixture (`invalid-email`) for production-like runs.
3. Decide whether to migrate DB constraint to include `publish_retry_failed` explicitly (current compatibility mapping is functional but transitional).
