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
   - Supports explicit mode split: `rehearsal` vs `production`.
   - Runs required checks (`clean tree`, `typecheck`, `test:i18n`) plus optional quality checks.
   - Writes per-cycle JSON reports to `reports/autoloop/`.
   - Stops immediately when required checks fail or policy hard-stop conditions are met.
   - Supports lock file for concurrent-run blocking.

## Safety Contract

- Default posture is conservative:
  - No destructive git command.
  - No force push.
  - No merge without explicit confirmation.
  - No merge in `rehearsal` mode.
  - No infinite unbounded loop by default.
- Required checks are blocking.
- `low-risk` label policy is required for any automated merge candidate.
- Base branch is fixed to `main`.
- Allowlist paths are enforced before merge:
  - `docs/**`
  - `messages/**`
  - `memory-bank/**`
  - `tests/unit/admin-i18n-hardcoded.test.ts`
- Any regression turns loop into "stop and report" mode.
- Emergency stop switch file is supported (`reports/autoloop/.automerge-stop` by default).

## Run Commands

```bash
# 1) Rehearsal mode (safe local rehearsal while editing)
pnpm autoloop:rehearsal

# 2) Real bounded run (example: 24h window, 48 cycles, 30m interval)
pnpm autoloop:production

# 3) Safe PR merge helper
pnpm pr:automerge:safe --pr=123 --method=merge --confirm
```

If you want production mode to auto-merge low-risk candidates:

```bash
pnpm autoloop:poc \
  --mode=production \
  --max-cycles=48 \
  --max-hours=24 \
  --interval-minutes=30 \
  --required-secrets=CONTENT_OPS_AUTOMATION_TOKEN \
  --merge-enabled=true
```

## Cursor Automations Contract (Primary Scheduler)

Use bounded invocations rather than a single infinite process.

- Rehearsal slot: once daily.
- Production slot: weekdays, 2-4 runs/day.
- Required execution payload fields:
  - `command`: one of the standardized `pnpm autoloop:*` commands
  - `cursorRunId`: unique execution id (forwarded with `--cursor-run-id=...`)
  - `mode`: `rehearsal` or `production`
  - `mergeEnabled`: `false` by default

Recommended production command template:

```bash
pnpm autoloop:poc \
  --mode=production \
  --cursor-run-id=${RUN_ID} \
  --max-cycles=8 \
  --max-hours=4 \
  --interval-minutes=30 \
  --required-secrets=CONTENT_OPS_AUTOMATION_TOKEN \
  --merge-enabled=false
```

## 24h Continuous Operation Preparation

For a practical 24h operation, trigger this script with Cursor Automations or GitHub Actions scheduler.

Recommended rollout:

1. Start with dry-run reports only for 1 day.
2. Enable real check loop for 1 day (still no auto-merge).
3. Enable `pr-automerge-safe` only for a narrow label scope (e.g., docs/i18n).
4. Expand scope after observing zero critical incidents.

## Stop Conditions

Hard-stop conditions:

- required check failure (`typecheck`, `test:i18n`, or clean-tree requirement in production)
- missing required secret(s)
- policy/merge gate failure (`low-risk` label, allowlist, base mismatch, failed checks)
- emergency stop switch file exists (`reports/autoloop/.automerge-stop`)

Soft-stop conditions:

- optional quality checks fail:
  - merge is disabled for the cycle
  - cycle writes warning report and stops

## Non-POC (Intentional Exclusions)

- No direct autonomous code generation/commit in this first POC.
- No automatic destructive operation or schema migration execution.
- No bypass of human approval for critical-risk areas.
