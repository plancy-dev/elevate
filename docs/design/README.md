# Design documentation (Elevate)

## Architecture

The repo has a root **`DESIGN.md`** next to `AGENTS.md` ([Stitch / awesome-design-md](https://github.com/VoltAgent/awesome-design-md) convention). It is **Cal.com–inspired** (neutral SaaS moodboard) with **§0** tying it to Elevate tokens. Vendored snapshots stay under `third-party/` (Cursor pack, Cal CLI pack) so upstream diffs do not fight customized prose.

See **[`SYSTEM.md`](SYSTEM.md)** for how [awesome-design-md](https://github.com/VoltAgent/awesome-design-md), [getdesign.md](https://getdesign.md/what-is-design-md), Elevate tokens, and surface modes (marketing chrome vs app shell) fit together.

**Cal → shipped UI:** [`elevate-cal-alignment.md`](elevate-cal-alignment.md) · **Cursor marketing → tokens:** [`elevate-cursor-alignment.md`](elevate-cursor-alignment.md)

**Visual contract (CREATIVE):** **[`VISUAL_LANGUAGE_V2.md`](VISUAL_LANGUAGE_V2.md)** — accent discipline, radius scale, rollout order for Apple-tier polish.

**PLAN (PR breakdown):** **[`PLAN_VISUAL_LANGUAGE_V2_ROLLOUT.md`](PLAN_VISUAL_LANGUAGE_V2_ROLLOUT.md)** — §9 as PR-1 … PR-6.

**Quality (gstack + verify):** **[`QUALITY_PIPELINE.md`](QUALITY_PIPELINE.md)** — designer plan review → engineering plan review → build → verify → optional visual QA.

**Audit (consistency + UX redesign judgment):** **[`DESIGN_UX_AUDIT_REPORT.md`](DESIGN_UX_AUDIT_REPORT.md)** — code/docs review (2026-04-06) + live screenshots in [`audit-screenshots/`](audit-screenshots/) (2026-04-08).

**Dashboard (app shell) anti-template rules:** **[`DASHBOARD_UX_PRINCIPLES.md`](DASHBOARD_UX_PRINCIPLES.md)** — lists as one container + row hover; nav marker discipline.

**Pointers & cursors:** **[`INTERACTIVE_AFFORDANCES.md`](INTERACTIVE_AFFORDANCES.md)** — links, tabs, buttons, selects; base layer in `globals.css`.

**Navigation loading:** **[`NAVIGATION_LOADING.md`](NAVIGATION_LOADING.md)** — `loading.tsx`, `useLinkStatus`, `DashboardNavLink` / `ButtonLink`.

## Purpose

- **Shipped UI** is driven by **`src/app/globals.css`** and Tailwind v4 `@theme` tokens.
- **Cursor-inspired reference** (warm marketing aesthetic, typography notes, component language) lives under [`third-party/cursor-awesome-design-md/`](third-party/cursor-awesome-design-md/) as a **vendored** [`DESIGN.md`](third-party/cursor-awesome-design-md/DESIGN.md) from [awesome-design-md](https://github.com/VoltAgent/awesome-design-md/tree/main/design-md/cursor/). It is MIT-licensed third-party material; it is **not** an official Cursor release.
- **Translation layers:** [`elevate-cal-alignment.md`](elevate-cal-alignment.md) (Cal moodboard → tokens), [`elevate-cursor-alignment.md`](elevate-cursor-alignment.md) (Cursor marketing → tokens).

## Incremental refactor playbook

1. **Read** the alignment doc and the vendored `DESIGN.md` before large UI changes.
2. **Scope** each PR: either **marketing** (`[locale]/(marketing)`) or **dashboard** (`(dashboard)`) or **shared tokens** — avoid mixing all three in one change.
3. **Tokens first (optional):** add or adjust CSS variables in `globals.css`, expose via `@theme`, then update components to use semantic names (`bg-background`, `text-text-primary`, etc.).
4. **Verify:** `pnpm verify`; spot-check light/dark and keyboard focus.

## Agent workflow

- For new screens, prefer **existing** Tailwind token classes tied to `globals.css`.
- When the product asks for “Cursor-like” marketing polish, consult **`DESIGN.md`** + **`elevate-cursor-alignment.md`**, then implement the smallest diff that matches the request.

## Syncing upstream `DESIGN.md`

See [`third-party/cursor-awesome-design-md/README.md`](third-party/cursor-awesome-design-md/README.md).
