# REFLECT — Prod `toss_payment_intents` drop decision (2026-05-05)

## Decision

**Deferred (not executed)** in this agent session.

- **Reason:** No production Supabase access from the repo/agent; `draft-drop-toss-payment-intents.sql` is **operator-owned** per [`docs/adr/ADR-005-payment-rails-lemon-primary-toss-deferred.md`](../docs/adr/ADR-005-payment-rails-lemon-primary-toss-deferred.md) § Legacy table removal.
- **Default policy:** retain legacy table until explicit ops sign-off + row backup if needed.

## Evidence this session

| Artifact | Status |
|----------|--------|
| SQL run on prod | **N/A** — not performed |
| Row backup (CSV/export) | **N/A** — not performed |
| `pnpm db:types` after drop | **N/A** — table still present in remote schema assumption |

## When an operator executes the drop

1. Backup / export rows if required for audit.  
2. Run [`docs/operations/draft-drop-toss-payment-intents.sql`](../docs/operations/draft-drop-toss-payment-intents.sql) in Supabase SQL Editor (production project).  
3. Run `pnpm db:types` locally against that project; commit `src/types/database.types.ts` changes in a PR.  
4. Smoke: billing/library paths unchanged (app already does not use the table).  
5. PR or GitHub issue: attach export path or checksum + types diff summary; use **Refs**/`Closes` per team issue.

## GitHub

No issue number was supplied for this session — add **Refs #…** on the ops PR when filed.
