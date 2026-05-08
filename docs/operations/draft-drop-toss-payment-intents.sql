-- =============================================================================
-- DRAFT ONLY — NOT a Supabase migration; do NOT commit as migrations/0XX_*.sql
-- =============================================================================
-- Purpose: Remove legacy `public.toss_payment_intents` after product/ops agree
-- the PoC rows are expendable (audit, finance, or legal sign-off as required).
--
-- Preconditions (human):
--   1. App no longer references this table (Elevate: Toss PoC removed — ADR-005).
--   2. Backup or export if any row may be needed later, e.g.:
--        copy (select * from public.toss_payment_intents) to stdout with csv header;
--   3. Run in SQL Editor (or maintenance window), then `pnpm db:types` to refresh
--      `src/types/database.types.ts`.
--
-- Safe re-run: uses IF EXISTS.
-- =============================================================================

drop table if exists public.toss_payment_intents cascade;
