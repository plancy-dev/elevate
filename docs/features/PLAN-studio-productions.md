# PLAN input — Studio Productions MVP

**Status (2026-04):** v1 is **shipped** — routes under `/dashboard/productions` (list, new, episode detail, workbench). This document stays useful for **backlog slices**, open decisions, and `/autoplan` scope.

**Purpose:** One file for **Cursor Plan** and optional **gstack `/autoplan`**. Scope matches **ADR-003** and **GSTACK_REVIEW § A.4** (links, optional shortcuts, labels; no vendor APIs).

## Goal

Ship **org-scoped production ledger**: episodes (deliverables) + artifacts (prompt text, external URLs, `tool_platform` / `artifact_role` labels). Dashboard CRUD. Library remains catalog-only.

## Non-goals (v1)

- No Runway, Kling, YouTube, Gemini OAuth or server APIs.
- No video file upload in v1.
- No Prompt Studio LLM call required to ship (ADR-002).

## Technical anchors

- Migration: `supabase/migrations/017_studio_productions.sql` (renumber if taken).
- Tables: `studio_production_episodes`, `studio_production_artifacts` (see ADR-003).
- RLS: `organization_id = user_organization_id()`; artifacts denormalize org_id; trigger optional.
- Routes: `src/app/(dashboard)/dashboard/productions/` (implemented).

## MVP slices (BUILD order)

1. Migration + types (`pnpm db:types`).
2. List episodes + create.
3. Episode detail + artifacts CRUD + link rendering (`noopener`).
4. i18n `Dashboard.productions.*` (en + ko).
5. Optional: static help strip (tool names as copy only).

## Open decisions for Plan mode

- Exact path: `/dashboard/productions` vs `/dashboard/studio/productions`.
- Same PR vs follow-up for help strip (J4) and PostHog (J5).

## References

- [`docs/adr/ADR-003-studio-productions-mvp.md`](../adr/ADR-003-studio-productions-mvp.md)
- [`docs/features/GSTACK_REVIEW-production-workbench.md`](GSTACK_REVIEW-production-workbench.md)
