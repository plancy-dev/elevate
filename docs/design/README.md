# Design documentation (Elevate)

## Architecture

The repo has a root **`DESIGN.md`** (pointer) so agents that expect `DESIGN.md` next to `AGENTS.md` land in the right place; the long-form vendored file stays under `third-party/` to avoid drift.

See **[`SYSTEM.md`](SYSTEM.md)** for how [awesome-design-md](https://github.com/VoltAgent/awesome-design-md) references, Elevate tokens, and surface modes (marketing chrome vs app shell) fit together.

**Quality (gstack + verify):** **[`QUALITY_PIPELINE.md`](QUALITY_PIPELINE.md)** — designer plan review → engineering plan review → build → verify → optional visual QA.

## Purpose

- **Shipped UI** is driven by **`src/app/globals.css`** and Tailwind v4 `@theme` tokens.
- **Cursor-inspired reference** (warm marketing aesthetic, typography notes, component language) lives under [`third-party/cursor-awesome-design-md/`](third-party/cursor-awesome-design-md/) as a **vendored** [`DESIGN.md`](third-party/cursor-awesome-design-md/DESIGN.md) from [awesome-design-md](https://github.com/VoltAgent/awesome-design-md/tree/main/design-md/cursor/). It is MIT-licensed third-party material; it is **not** an official Cursor release.
- **Translation layer:** [`elevate-cursor-alignment.md`](elevate-cursor-alignment.md) maps reference concepts → Elevate variables and suggests rollout order.

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
