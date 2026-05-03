# CREATIVE — Dashboard sidebar rationalization (GitHub #62, partial)

**Refs:** [#62](https://github.com/plancy-dev/elevate/issues/62), audit §2.5 · [#60](https://github.com/plancy-dev/elevate/issues/60) (positioning — full IA deferred).

## Decision (this increment)

1. **Library group vs item label** — TOC section heading and child link MUST NOT repeat the same surface string (KO “라이브러리/라이브러리”, EN “Library/Library”). **Approach:** use a **catalog-style section title** (`Dashboard.toc.library.section`) distinct from the **nav item** (`Dashboard.toc.library.library`) in all locales.
2. **Permission guards** — Sidebar already gates **Audit** (`/dashboard/organization/audit`) and **Admin** (`/dashboard/admin`) with `isOrgAdmin` / `isServiceAdmin` from `src/app/(dashboard)/layout.tsx`. No TOC change this round; **follow-up:** confirm org audit page **fails closed** for direct URL when `profiles.role !== admin` (data layer + redirect).
3. **Deferred until #60** — Collapsing to 4–5 top items, Productions vs Studio naming, “편집실” vs Studio mental model — **blocked on scenario A/B/C**.

## Verification

- `pnpm verify` after i18n + CI workflow change.
- Manual: expanded sidebar shows **two different strings** for library group vs link in ko/en.

## Out of scope (later PR)

- PostHog sidebar event matrix; keyboard/aria regression sweep; full 13→4 item merge.
