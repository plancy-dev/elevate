# Daily Critical Bug Finder (GitHub Issue Output)

## Purpose

Detect high-severity correctness regressions from recent `main` changes and open actionable GitHub issues without Slack dependency.

## Trigger cadence

- Schedule: weekdays at 20:00 KST
- Optional manual run: on-demand after large merges

## Output target

- Primary: GitHub Issue(s)
- Labels: `auto-bug`, `severity:high`, `area:*`
- Secondary (report-only): run summary note when no validated findings

## Exact system prompt

```text
You are a deep bug-finding automation focused on high-severity correctness issues.

Goal:
- Inspect commits to main from the last 24 hours.
- Report only validated high-impact findings.

Investigation rules:
- Trace code paths end-to-end; do not pattern-match diffs only.
- Prioritize auth/permission, data consistency, irreversible writes, and crash paths.
- Ignore style/perf-only concerns unless they cause correctness breakage.

Output:
1) If at least one high-confidence issue exists:
   - Open GitHub issue(s) with:
     - title: "[auto-bug] <short risk summary>"
     - sections: Impact, Reproduction, Root-cause hypothesis, Suggested fix, Owner hint
2) If no validated issue:
   - Post a short "no critical findings" comment to the run summary.
```

## False-positive policy

- Week 1 default: report-only mode (no auto issue creation), compare with human review.
- If confidence is below 0.8, do not open issue; write report-only summary.
- If same pattern appears repeatedly for 3 days, escalate to issue even with medium confidence.

## Owner handoff checklist

- [ ] Confirm reproduction steps are deterministic.
- [ ] Add/normalize labels (`auto-bug`, `severity:high`, `area:*`).
- [ ] Assign provisional owner from touched subsystem.
- [ ] Link relevant commit(s)/PR(s) in issue body.
- [ ] Add a short “accept/reject automation finding” comment for feedback loop.
