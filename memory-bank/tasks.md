# Elevate — Tasks (Reset 2026-05-01)

## Current Mission (SoT)

### Continuous Improvement Autoloop POC

Goal: automate repetitive operator loops safely, without harming core product flows.

## Phase 0 — Done

- [x] Merge PR #32 and PR #33.
- [x] Sync local `main` with `origin/main`.
- [x] Ensure clean working tree.

## Phase 1 — Autoloop POC Implementation

- [ ] Add safe PR monitor/automerge helper (`checks green + explicit confirm flag`).
- [ ] Add bounded continuous-improvement loop runner (`max hours/cycles`, stop-on-fail).
- [ ] Emit machine-readable run reports under a dedicated reports directory.
- [ ] Keep default mode dry-run / non-destructive.

## Phase 2 — Safety & Quality Guardrails

- [ ] Enforce admin i18n hardcoded-text guard in CI path (`pnpm test:i18n`).
- [ ] Add preflight checks for clean tree and branch safety before automated actions.
- [ ] Define hard-stop conditions (failing tests, dirty tree, missing secrets).

## Phase 3 — Operations Prep

- [ ] Update runbook for multilingual smoke QA + quality monitor interpretation.
- [ ] Document unattended operation contract (required env vars, allowed actions).
- [ ] Prepare a Cursor Automations trigger/sequence for scheduled bounded runs.

## Phase 4 — Content Quality v1.2 Experiment

- [ ] Upgrade topic/prompt packs to v1.2.0.
- [ ] Add evidence/outcome/customer-relevance sections in generated drafts.
- [ ] Validate with targeted unit tests and monitor fresh 24h quality metrics.

## Exit Criteria

- [ ] All new scripts/tests/docs are merged.
- [ ] Autoloop POC can run for bounded windows without manual intervention.
- [ ] No destructive operation is possible without explicit opt-in flag.
