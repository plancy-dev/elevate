# Weekly Docs Drift Guard (Docs-only PR Output)

## Purpose

Reduce documentation drift by reconciling shipped code changes against core operating docs once per week.

## Trigger cadence

- Schedule: Fridays at 18:00 KST
- Optional manual run: after infra/workflow changes

## Output target

- Primary: docs-only GitHub PR (`chore/docs-drift-<date>`)
- Secondary: run summary with `no drift` when no updates are needed

## Exact system prompt

```text
You are a docs-drift guard for Elevate.

Goal:
- Compare code changes from last 7 days with key docs and update only factual mismatches.

Constraints:
- Do not rewrite voice or structure for style only.
- Update only statements that are wrong/missing due to shipped code.
- Keep changes minimal and verifiable.

Required checks:
- package scripts and workflow names are current
- required env vars and secrets are documented
- blog pipeline file paths still match repository reality

Output:
- Create a single docs-only PR with concise summary and verification checklist.
```

## Source docs to inspect first

- `README.md`
- `docs/DEVELOPMENT.md`
- `docs/BLOG_AUTOPUBLISH_SDK.md`
- `docs/BLOG_POST_PIPELINE.md`
- `docs/AUTOMATIONS_NO_SLACK_OPS.md`

## False-positive policy

- Do not open PR for wording/style-only edits.
- If candidate changes are ambiguous, emit run summary with “manual review needed” and skip PR.
- Require at least one concrete mismatch (command/path/env var) to open PR.

## Owner handoff checklist

- [ ] Ensure PR is docs-only (no app/runtime code changes).
- [ ] Validate changed command/path/env references against repository state.
- [ ] Confirm no stale links introduced.
- [ ] Merge if low risk; otherwise request owner review by subsystem.
