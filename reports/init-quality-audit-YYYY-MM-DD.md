# INIT Quality Audit — YYYY-MM-DD

## Inputs

- Generated at: `{{generated_at_iso}}`
- Observation windows:
  - Current: `{{current_window_start}}` ~ `{{current_window_end}}`
  - Previous: `{{previous_window_start}}` ~ `{{previous_window_end}}`
- Commands:
  - `pnpm run content-ops:gate-check`
  - `pnpm run content-ops:quality:monitor`
  - Supporting SQL snapshots for `content_publications`, `content_items`, `content_runs`

## Metrics Snapshot

- Publications (24h):
  - `total`: `{{pub_total_24h}}`
  - `failed`: `{{pub_failed_24h}}`
  - `failRatio`: `{{pub_fail_ratio_24h}}%`
  - `resend_not_configured`: `{{resend_not_configured_24h}}`
  - `retry_exhausted`: `{{retry_exhausted_24h}}`
- Publications (previous 24h):
  - `failed`: `{{pub_failed_prev_24h}}`
  - `retry_exhausted`: `{{retry_exhausted_prev_24h}}`
- Novelty / review quality (24h vs previous 24h):
  - `low_novelty_ratio`: `{{low_novelty_ratio_24h}}` vs `{{low_novelty_ratio_prev_24h}}`
  - `blog_review_required_ratio`: `{{blog_review_required_ratio_24h}}` vs `{{blog_review_required_ratio_prev_24h}}`
  - `sample_count_24h`: `{{novelty_sample_count_24h}}`

## Gate Decisions

- `#49`: `{{gate49_status}}`
  - `decision_reason`: `{{gate49_reason}}`
  - Evidence: `{{gate49_evidence_line}}`
- `#50`: `{{gate50_status}}`
  - `decision_reason`: `{{gate50_reason}}`
  - Evidence: `{{gate50_evidence_line}}`
- `#51`: `{{gate51_status}}`
  - `decision_reason`: `{{gate51_reason}}`
  - Evidence: `{{gate51_evidence_line}}`

## Close/Hold Decision

- Close now:
  - `{{close_list_or_none}}`
- Hold open:
  - `{{hold_list_or_none}}`
- Blocking condition(s):
  - `{{blocking_conditions}}`

## Issue Close Payload Drafts

### #49

`{{issue49_close_payload}}`

### #50

`{{issue50_close_payload}}`

### #51

`{{issue51_close_payload}}`

## INIT Handoff (Residual Stabilization Risk)

- Residual risk summary: `{{risk_summary}}`
- Owner: `{{owner}}`
- Next action: `{{next_action}}`
- Recheck ETA: `{{recheck_eta}}`
