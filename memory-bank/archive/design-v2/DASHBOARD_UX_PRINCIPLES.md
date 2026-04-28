# Dashboard UX principles — anti-template, pro-craft

**Audience:** Design + engineering. **Supplements:** [`VISUAL_LANGUAGE_V2.md`](VISUAL_LANGUAGE_V2.md), [`SYSTEM.md`](SYSTEM.md).

## Why this doc exists

Generated UIs often reuse the same **affordance clichés**: full-height left stripe on active nav, identical card stacks with heavy shadows, blue “AI slush” washes. They work but feel interchangeable. Elevate’s product shell should feel **intentional, calm, and instrument-like** (precision, not decoration).

## App shell navigation

| Avoid | Prefer |
|--------|--------|
| Tall rounded rectangle “tab rail” glued to the sidebar edge | A **short vertical marker** (pill, ~18–20px tall, primary color) **centered** on the row’s left, plus subtle **layer** background |
| Saturated blue fill on the whole row | **`bg-layer-02`** (or equivalent) + **primary only on marker + icon** |
| Competing vertical lines (border + bar + shadow) | **One** vertical signal per row |

**Rationale:** The eye reads a **dot/capsule** as “you are here” without mimicking every SaaS template. It matches a **depth budget of 2** (V2): background step + one accent.

## Callouts and inline notices (e.g. scope banners)

| Avoid | Prefer |
|--------|--------|
| **Left accent bar** (thick primary stripe) + “info alert” look | **Single** hairline `border-border-subtle`, subtle `bg-layer-02` wash, **no** extra vertical color rail — reads calmer and less “component-library default” |
| Loud info blue on neutral dashboard chrome | Hierarchy from **copy** and spacing; color only when something is actionable |

## Lists and tables (e.g. Productions, Library)

| Avoid | Prefer |
|--------|--------|
| N separate floating cards with identical shadows | **One** `rounded-xl` container, **`divide-y`** between rows, **hover** on row only |
| Status as the loudest element | Status as **compact** label; **title** leads hierarchy |

**Rationale:** A single bounded list reads as a **document** or **queue**, not a grid of generic widgets. Better scan path for repeat visits.

## Motion

- **100–150ms** color/background transitions on nav and list rows.
- No layout-shift animation on default navigation.
- Respect **`prefers-reduced-motion`** for any future non-critical motion.

## Pointers (tabs, links, actions)

Tab rows, sidebar links, and buttons should use the **hand pointer** on hover so affordances match appearance. Defaults are defined in **`src/app/globals.css`** (`@layer base`) and documented in [`INTERACTIVE_AFFORDANCES.md`](INTERACTIVE_AFFORDANCES.md). Segmented tabs (e.g. episode workbench) may use **selected** = filled surface + ring and **unselected** = text + hover wash — both states remain clickable with `cursor: pointer`.

## When marketing differs

Marketing may use warmer chrome and stronger hero contrast; **dashboard rules above stay in `(dashboard)`** unless a specific feature is approved as an exception in `VISUAL_LANGUAGE_V2.md`.
