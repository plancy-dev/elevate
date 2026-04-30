# Automations Operations Scorecard

Automation 운영 안정성과 콘텐츠 품질을 주간 단위로 측정하기 위한 기준 문서.

## Weekly metrics

| Metric | Target | Source |
|--------|--------|--------|
| `autopublish_success_rate` | >= 90% (2주 이동 평균) | GitHub Actions run result |
| `failure_classification_coverage` | 100% | `artifacts/blog-autopublish-status.json` |
| `merge_ready_draft_ratio` | >= 60% | blog auto PR 리뷰 결과 |
| `false_positive_rate_bug_finder` | <= 20% (dry week) | automation finding vs human verdict |
| `docs_drift_pr_precision` | >= 80% | docs drift PR accepted changes 비율 |

## Failure taxonomy (source of truth)

- `auth`: secret/token invalid or missing
- `env`: workflow/script env mapping mismatch
- `sdk_runtime`: runtime dependency or SDK execution layer failure
- `content_validation`: queue/output/schema mismatch
- `unknown`: uncategorized (must be triaged and reclassified within 24h)

## Operator handoff checklist

When an automation run fails:

- [ ] Confirm `failure_type` from status artifact.
- [ ] Confirm whether this is first-time or repeated failure pattern.
- [ ] Apply mapped recovery action from `docs/BLOG_AUTOPUBLISH_SDK.md`.
- [ ] Re-run once manually (`workflow_dispatch`, `push_mode=pr`).
- [ ] If still failing, open GitHub issue with logs and artifact payload.

When an automation run succeeds:

- [ ] Verify expected output target was produced (PR/Issue/docs update).
- [ ] Verify labels/owners are attached for downstream action.
- [ ] Add one-line weekly note on quality trend (better/same/worse).

## Review cadence

- Weekly: quick review (15 min) of metrics and top 1 failure cluster.
- Monthly: prompt/rule tuning based on false positives and merge-ready ratio.
