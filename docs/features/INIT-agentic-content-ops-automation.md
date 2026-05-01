# INIT — Agentic Content Ops Automation (Cursor API Key)

## Request Summary

Prepare an operations-ready automation layer where:

- newsletter/blog drafts are generated automatically on schedule
- human admin approval remains mandatory before publish
- unapproved items accumulate in queue (daily/weekly cadence)
- content quality is meaningfully high (not short filler drafts)
- prompts/templates can be replaced later without refactoring core pipeline

This INIT does **not** implement runtime automation yet; it locks execution strategy for the next BUILD.

## Fixed Decisions (SoT)

1. **Human approval remains mandatory** before external publish.
2. **Agent automation target is ingest + draft + review pre-check**, not bypassing editorial approval.
3. **Queue-first behavior**: if admin does not approve, content remains in `draft/review_required` and accumulates.
4. **Quality strategy is template-driven** with audience/persona-aware prompt packs.
5. **Prompt/template config must be hot-swappable by code** (replace files/constants without schema churn).
6. **Cursor API Key is managed as secret** in scheduler runtime (GitHub Actions or equivalent), never in source.

## Why This Direction

- Existing content-ops foundation is implemented (`ingest`/`draft_generate`/`review_gate`/`publish` + admin queue).
- Missing value is orchestration reliability and quality governance, not base CRUD/workflow.
- Hard separation between generation and approval preserves trust/compliance while allowing scale.
- Prompt packs as first-class config give fast quality iteration after live feedback.

## Current Codebase Anchors

- Pipeline runs: `src/lib/content-ops/pipeline-runner.ts`
- Admin run actions: `src/actions/admin-content-ops.ts`
- Admin views: `src/app/(admin)/admin/runs/page.tsx`, `src/app/(admin)/admin/content-queue/page.tsx`
- Quality gate: `src/lib/content-ops/review-gate.ts`
- Locale template base: `src/lib/content-ops/locale-template-config.ts`
- Operational runbook: `docs/features/RUNBOOK-content-ops.md`

## Scope (INIT -> PLAN input)

### In Scope

- Agent scheduler topology using Cursor API Key (secure secret model)
- Run orchestration policy:
  - daily: `ingest` -> `draft_generate` -> `review_gate`
  - publish window: approved/scheduled only
  - retry failed only window
- Quality architecture:
  - topic selection policy by audience intent
  - prompt pack system (newsletter/blog)
  - template registry and versioning policy
- Editorial governance:
  - queue accumulation behavior
  - approval SLA and backlog thresholds
  - "must-review" escalation conditions
- Operability:
  - failure alerting requirements
  - minimum health metrics
  - run-level audit and rollback behavior

### Out of Scope (this INIT)

- shipping production cron runner code
- replacing all current draft generation prompts immediately
- introducing non-admin CMS editor
- advanced personalization/recommendation engine

## Quality Objective (Business)

Content must drive a visible user reaction, not "placeholder text".

MVP quality intent:

- each piece has a clear audience pain/curiosity hook
- actionable insight density is measurable (checklist, examples, contrast)
- source-grounded claims with explicit references
- CTA alignment with product intent (operator workflow adoption)

## Prompt/Template Swap Contract

Prompt and template quality must be replaceable in one place.

Planned contract:

- `prompt-pack` (topic strategy + structure + tone + guardrails)
- `template-pack` (locale copy + CTA + framing sections)
- `version metadata` attached to generated/published records
- runtime resolver uses active version key; swapping key changes output behavior

No hard dependency on DB migration for first iteration; file/config-first replacement is acceptable.

## Suggested Build Slices (next phase)

1. **B1 — Agent scheduler wiring**
   - secure env handling (`CURSOR_API_KEY`)
   - deterministic run schedule
   - lock/idempotency to avoid duplicate run storms
2. **B2 — Prompt pack system**
   - audience/topic matrix
   - newsletter/blog generation contracts
   - fallback pack rules
3. **B3 — Quality scorecard + gates**
   - enrich review gate beyond minimum checks
   - score metadata persisted per item
4. **B4 — Editorial ops policy**
   - backlog SLA thresholds + alerts
   - "publish window" and "manual override" policy
5. **B5 — Operability hardening**
   - run summary metrics
   - failure taxonomy dashboard fields
   - retry/rollback runbook completion

## Success Criteria (for next BUILD)

- automated generation runs execute on schedule without manual trigger
- unapproved content safely accumulates in queue (no accidental send)
- approved content publishes in configured windows
- prompt/template version can be swapped by editing code config only
- first-week quality feedback loop can update packs in < 1 day

## Next Mode

`PLAN` — lock architecture, schedule policy, prompt pack schema, and quality score rubric before BUILD.
