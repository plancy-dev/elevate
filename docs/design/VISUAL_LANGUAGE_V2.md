# Visual Language v2 — Apple-tier discipline (Elevate)

**Status:** CREATIVE lock — implementation follows this doc unless explicitly superseded.  
**Audience:** Design + engineering. **North star:** Calm, one accent per story, obsessive consistency — not “more decoration.”

---

## 1. Principles (non-negotiable)

| # | Principle | What it means in practice |
|---|-------------|-----------------------------|
| P1 | **One accent per story** | In any major viewport band (hero, card cluster, form), **one** saturated hue leads; everything else is neutral or tint. |
| P2 | **Two surfaces, one contract** | **Marketing** = warm canvas + orange **only** for primary conversion. **Product** = cool neutrals + **blue** for all interactive affordances. No third “brand” color in UI chrome. |
| P3 | **Radius is semantic** | Radius encodes **role**, not taste-of-the-day: controls share one radius family; marketing pills are the **only** full pills for CTAs. |
| P4 | **Depth budget = 2** | Page background vs elevated card — optional third **only** for modal/dropdown. No competing drop shadows. |
| P5 | **Motion is invisible** | Default 120–180ms, `ease-out`; respect `prefers-reduced-motion` (opacity/transform off or 0ms). |
| P6 | **Typography is the hierarchy** | Size/weight/opacity carry structure; color does not compete for hierarchy except accent + danger. |

---

## 2. Surface modes (strict)

### 2.1 Marketing (`elevate-marketing-chrome`)

- **Canvas:** `--marketing-canvas` (light) / dark marketing canvas in `.dark`.
- **Text:** `--marketing-ink*` stack only for body/headline on marketing routes.
- **Primary CTA:** `Button variant="marketing"` **or** link styled with `text-marketing-accent` + underline on hover for secondary emphasis — **never** mix with `bg-primary` in the same row as a second “primary.”
- **Charts / KPI preview on marketing:** Treat as **product preview**: use **neutral strokes + single blue series** OR monochrome bars; **do not** add orange to charts (avoids third accent). Label small: “Product UI preview.”
- **Focus rings on marketing:** `--marketing-accent` (already mapped via `.elevate-marketing-chrome`).

### 2.2 App shell (`(dashboard)` / `(admin)`)

- **Interactive color:** `--primary` / `--interactive` only (IBM blue family). **No `--marketing-accent`** in app chrome, sidebar, tables, or studio — **ever**, unless an explicit future “brand stripe” component is approved (out of v2 scope).
- **Sidebar active item:** Prefer a **short vertical marker** (rounded capsule, primary) + **`bg-layer-02`** — not a full-height left rail or heavy blue wash (see [`DASHBOARD_UX_PRINCIPLES.md`](DASHBOARD_UX_PRINCIPLES.md)).
- **Logo mark:** Blue is allowed; it is wayfinding, not a second CTA.

### 2.3 Auth (`(auth)`)

- Neutral panels; **blue** links and primary submit (`Button variant="primary"`). **No orange** on auth — reduces mode confusion for first-time users.

---

## 3. Color roles (token-level)

| Role | Token(s) | Use |
|------|-----------|-----|
| Page bg | `--background` | Full bleed |
| Elevated panel | `--layer-01` / `--surface` | Cards, modals |
| Muted panel | `--layer-02` | Inset areas, sidebars |
| Border hairline | `--border-subtle` | Default dividers |
| Body | `--text-primary` / `--text-secondary` / `--text-tertiary` | Never use `--primary` for text |
| Action | `--interactive` + `--primary` fills | Buttons, links (app) |
| Success (rare) | `--accent` | Positive badges only — not marketing CTAs |
| Danger | `--danger` | Destructive only |
| Marketing CTA fill | `--marketing-accent` | **Marketing primary buttons only** |

**Selection chrome:** Keep blue selection in marketing for text selection OR switch to marketing-tinted selection in a later BUILD task — v2 allows current `::selection` blue on marketing if contrast passes; optional polish.

---

## 4. Radius & shape system

**Canonical scale** (align CSS variables + Tailwind):

| Token | Value | Use |
|-------|-------|-----|
| `--elevate-radius-sm` | 4px (`0.25rem`) | Legacy tight chips only; **deprecate** for new UI |
| `--elevate-radius-md` | 8px (`0.5rem`) | Tabs, segmented control inner, small buttons in dense tables |
| `--elevate-radius-lg` | 10px (`0.625rem`) | **Default** inputs, default buttons (non-pill), checkboxes wrappers |
| `--elevate-radius-xl` | **12px (`0.75rem`)** — **add in BUILD** | Cards, dialogs, large panels |
| `--elevate-radius-pill` | 9999px | Marketing CTA **only** (`variant="marketing"`) |

**Rules:**

- **App primary/secondary Button (non-marketing):** `rounded-lg` minimum; never `rounded-sm`.
- **Marketing CTA:** `rounded-full` via `variant="marketing"` only.
- **Sidebar nav items:** `rounded-md` or `rounded-lg` for active pill — **same** as other inset controls in app.

---

## 5. Typography

- **Font:** Geist (existing). No new licensed display font in v2 without legal sign-off.
- **Marketing H1:** `text-3xl`–`text-4xl`, `font-semibold`, `tracking-tight` — max **two** weights in hero (semibold + regular body).
- **App page title:** `text-2xl` `font-semibold` `tracking-tight` — consistent across dashboard.
- **Uppercase section labels:** `text-[11px]`–`text-xs`, `font-semibold`, `uppercase`, `tracking-wider`, `--text-tertiary` — **never** orange.
- **Line length:** marketing copy max-width ~65ch where possible.

---

## 6. Elevation & borders

- **Card:** `border border-border-subtle` + `shadow-card` **or** border-only on dense pages — pick **one pattern per page type** in BUILD (overview: shadow; dense tables: border-only).
- **No double borders:** card inside card uses background step (`layer-02`) instead of second border ring.

---

## 7. Motion

| Use | Duration | Easing |
|-----|----------|--------|
| Hover (color/bg) | 100ms | default transition |
| Panel expand / modal | 160ms | `ease-out` |
| Route transition | 0ms (v2) | No page transition unless product asks |

`@media (prefers-reduced-motion: reduce)` — disable hero keyframes that move layout; keep opacity fades optional at 0ms.

---

## 8. Component API (v2 expectations)

- **Button:** Keep variants; **enforce** `marketing` only under marketing layout (lint or code review).
- **Input / Textarea:** Always `rounded-lg`; never raw `rounded-sm` on fields.
- **Tabs (auth, settings):** Container `rounded-lg`, tab `rounded-md` — already aligned; extend to all tab UIs.
- **Links:** App = `text-interactive`; marketing body links = `text-interactive` (maps to orange in chrome) **or** underline + marketing-ink — **one style per page**.

---

## 9. BUILD rollout order (mandatory)

1. **Tokens:** Add `--elevate-radius-xl`; optionally tune `--elevate-shadow-card` single definition.
2. **Primitives:** Button (non-marketing), Input, Card, field-select → radius + focus parity.
3. **App shell:** Sidebar active state → pill inset.
4. **Marketing:** Hero KPI / Pretext — monochrome + one blue trace OR neutral-only.
5. **Auth / admin leftovers:** sweep `rounded-sm` → scale above.
6. **QA:** Light/dark, keyboard, `pnpm verify`, screenshot marketing + dashboard.

**PR-sized plan (merge order, acceptance, file hints):** [`PLAN_VISUAL_LANGUAGE_V2_ROLLOUT.md`](PLAN_VISUAL_LANGUAGE_V2_ROLLOUT.md)

---

## 10. Out of scope for v2 (explicit)

- Custom font licensing or rebrand name.
- Full illustration system.
- Page transition animations.
- Changing IBM blue to another blue (brand equity for product).

---

## 11. References

- [`SYSTEM.md`](SYSTEM.md) — layer model; this doc **narrows** choices for execution.
- [`DESIGN_UX_AUDIT_REPORT.md`](DESIGN_UX_AUDIT_REPORT.md) — prior audit context.
- [`elevate-cursor-alignment.md`](elevate-cursor-alignment.md) — token mapping from reference docs.

---

## 12. Shipment note (rolling)

| Date | Milestone |
|------|-----------|
| **2026-04** | **PR-1–PR-5** implemented in-tree: tokens (`--elevate-radius-xl` + theme bridge), primitives (Button/Input/Card/selects), sidebar inset pill, marketing KPI + Pretext hero discipline, `rounded-sm` sweep across `src/`. **`pnpm verify`** green. |
| | **PR-6 (partial):** Doc + checklist alignment (this section + [`PLAN_VISUAL_LANGUAGE_V2_ROLLOUT.md`](PLAN_VISUAL_LANGUAGE_V2_ROLLOUT.md)). Optional follow-up: refresh [`DESIGN_UX_AUDIT_REPORT.md`](DESIGN_UX_AUDIT_REPORT.md) / `docs/design/audit-screenshots/` after staging sign-off. |

Rollout detail and merge order: [`PLAN_VISUAL_LANGUAGE_V2_ROLLOUT.md`](PLAN_VISUAL_LANGUAGE_V2_ROLLOUT.md).
