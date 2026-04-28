# Interactive affordances — cursor, hover, focus

**Audience:** Design + engineering. **Supplements:** [`SYSTEM.md`](SYSTEM.md), [`VISUAL_LANGUAGE_V2.md`](VISUAL_LANGUAGE_V2.md), [`DASHBOARD_UX_PRINCIPLES.md`](DASHBOARD_UX_PRINCIPLES.md).

## Why this doc exists

Users infer **clickability** from the pointer shape. If tabs, buttons, or links keep the default arrow, the UI feels inert even when hover styles exist. This doc is the **SoT for cursor + basic affordance rules**; implementation defaults live in **`src/app/globals.css`** (`@layer base`).

## Rules

| Element | Cursor | Notes |
|---------|--------|--------|
| Links `a[href]` | `pointer` | Including Next.js `<Link>` (renders `<a>`). |
| `button` (enabled) | `pointer` | Native and custom. |
| `button` (disabled) | `not-allowed` | Matches disabled opacity patterns. |
| `[role="tab"]` | `pointer` | Segmented controls / workbench tabs. |
| `[role="button"]` (not `aria-disabled`) | `pointer` | Div-based controls. |
| `summary` | `pointer` | Disclosure widgets. |
| `select` (enabled) | `pointer` | Native dropdowns (e.g. `FieldSelect`). |
| `select` (disabled) | `not-allowed` | |
| `input[type="file"]` (enabled) | `pointer` | |
| `label` wrapping enabled checkbox/radio | `pointer` | Hit target for form controls. |
| Plain text, static icons | default | Do not force `pointer` on non-interactive copy. |

## Hover

- Keep **100–150ms** transitions on color/background for nav and list rows ([`DASHBOARD_UX_PRINCIPLES.md`](DASHBOARD_UX_PRINCIPLES.md)).
- **Focus** must remain visible for **keyboard** users: prefer **`focus-visible`** rings/outlines on buttons and fields so **mouse clicks** do not flash a strong focus ring on every press ([`Button`](../../src/components/ui/button.tsx), [`FieldSelect`](../../src/components/ui/field-select.tsx)). Pointer rules do not replace keyboard affordances.

## Overrides

- If a component must **not** show a hand (e.g. drag handle → `grab`), set `cursor-*` in that component and document the exception in the PR.
- **Marketing** routes share the same base layer unless a page opts out with a scoped wrapper.

## Quality pipeline (gstack)

| When | Skill / gate |
|------|----------------|
| Plan | **`/plan-design-review`** — flows, tab patterns, density. |
| After build | **`/design-review`** — live polish, spacing, **hover/pointer** consistency. |
| Ship | **`pnpm verify`** + optional **`/qa`** / **`/browse`** for dogfood. |

Authority order: [`docs/AI_ORCHESTRATION.md`](../AI_ORCHESTRATION.md) — repo rules → memory-bank → gstack.

## Navigation loading (related)

Route transitions and link pending spinners are documented in **[`NAVIGATION_LOADING.md`](NAVIGATION_LOADING.md)** (`loading.tsx`, `useLinkStatus`).

## Changelog

- **2026-04-10:** Initial doc + `globals.css` `@layer base` defaults.
