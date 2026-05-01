# POC — Continuous Improvement Autoloop (2026-05)

## Goal

Automate repetitive operator loops (PR health check, merge readiness checks, quality gates)
without touching critical product behavior unsafely.

## What This POC Adds

1. `scripts/pr-automerge-safe.ts`
   - Safe helper for "check -> merge" automation.
   - Refuses to merge unless:
     - PR is open and not draft
     - merge state is `CLEAN`
     - no `CHANGES_REQUESTED`
     - all checks are green
     - explicit `--confirm` flag is present

2. `scripts/continuous-improvement-loop.ts`
   - Bounded loop runner with hard stops.
   - Runs required checks (`clean tree`, `typecheck`, `test:i18n`) plus optional quality checks.
   - Writes per-cycle JSON reports to `reports/autoloop/`.
   - Stops immediately when required checks fail.
   - Supports dry-run mode for safe rehearsal.

## Safety Contract

- Default posture is conservative:
  - No destructive git command.
  - No force push.
  - No merge without explicit confirmation.
  - No infinite unbounded loop by default.
- Required checks are blocking.
- Any regression turns loop into "stop and report" mode.

## Run Commands

```bash
# 1) Dry-run rehearsal (safe local rehearsal while editing)
pnpm autoloop:poc --dry-run --allow-dirty-tree --max-cycles=3 --max-hours=1 --interval-minutes=5

# 2) Real bounded run (example: 24h window, 48 cycles, 30m interval)
pnpm autoloop:poc --max-cycles=48 --max-hours=24 --interval-minutes=30

# 3) Safe PR merge helper
pnpm pr:automerge:safe --pr=123 --method=merge --confirm
```

## 24h Continuous Operation Preparation

For a practical 24h operation, trigger this script with Cursor Automations or GitHub Actions scheduler.

Recommended rollout:

1. Start with dry-run reports only for 1 day.
2. Enable real check loop for 1 day (still no auto-merge).
3. Enable `pr-automerge-safe` only for a narrow label scope (e.g., docs/i18n).
4. Expand scope after observing zero critical incidents.

## Non-POC (Intentional Exclusions)

- No direct autonomous code generation/commit in this first POC.
- No automatic destructive operation or schema migration execution.
- No bypass of human approval for critical-risk areas.
