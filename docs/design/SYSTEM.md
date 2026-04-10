# Elevate design system structure

This document defines **how** we layer external references, tokens, and UI so agents and humans can extend the product consistently. It complements [`README.md`](README.md) (workflow) and [`elevate-cursor-alignment.md`](elevate-cursor-alignment.md) (token mapping).

## 0. Visual execution contract (CREATIVE lock)

**Product-facing rules for calm, Apple-tier consistency** — marketing vs app accents, radius semantics, motion, rollout order:

→ **[`VISUAL_LANGUAGE_V2.md`](VISUAL_LANGUAGE_V2.md)**  
Dashboard nav/list anti-template notes: [`DASHBOARD_UX_PRINCIPLES.md`](DASHBOARD_UX_PRINCIPLES.md)  
Memory-bank pointer: [`memory-bank/creative-apple-tier-visual-system.md`](../memory-bank/creative-apple-tier-visual-system.md)

If `SYSTEM.md` and `VISUAL_LANGUAGE_V2.md` disagree on **visual behavior**, **V2 wins** until amended.

## 1. Reference layer — [awesome-design-md](https://github.com/VoltAgent/awesome-design-md)

[VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) is a **curated collection of `DESIGN.md` files** (Stitch-style) extracted from public sites — markdown that LLMs read well for UI generation. It is **not** official brand guidance from those companies.

**We use it as:**

| Artifact | Location | Role |
|----------|----------|------|
| Cursor-inspired doc | [`third-party/cursor-awesome-design-md/DESIGN.md`](third-party/cursor-awesome-design-md/DESIGN.md) | Warm cream palette, typography notes, component language, spacing/elevation ideas |
| Upstream index | [Repo README](https://github.com/VoltAgent/awesome-design-md/blob/main/README.md) | Discover other `DESIGN.md` (Vercel, Linear, …) if we add a second reference later |

**Rules:**

- Treat reference docs as **inspiration + vocabulary**, not pixel law.
- **Never** paste proprietary fonts (e.g. CursorGothic) into production without license; use Geist or system fallbacks unless explicitly licensed.
- When refreshing the vendored file, follow [`third-party/cursor-awesome-design-md/README.md`](third-party/cursor-awesome-design-md/README.md) (`curl` + commit).

## 2. Implementation layer — shipped tokens

**Source of truth:** `src/app/globals.css`

| Layer | What |
|-------|------|
| `:root` / `.dark` | Semantic colors (`--background`, `--text-primary`, `--primary`, …) |
| Marketing-only | `--marketing-*` (cream canvas, warm ink, orange accent) — scoped by `.elevate-marketing-chrome` |
| `@theme inline` | Tailwind v4 token bridge (`--color-*`, `--radius-*`, shadows) |
| `@layer base` (interactive) | Default **cursor** for links, buttons, tabs, selects — see [`INTERACTIVE_AFFORDANCES.md`](INTERACTIVE_AFFORDANCES.md) |
| Feature CSS | e.g. `src/app/film-strip.css` imported from `globals.css` |

Product surfaces **keep IBM-style blue primary** inside the app shell; marketing uses **warm marketing accent** for primary CTAs where specified in components.

## 3. Surface modes

| Mode | Where | Behavior |
|------|-------|----------|
| **Marketing chrome** | `[locale]/(marketing)/` layout | Wrapper sets warm text/border/interactive tokens; header/footer/main share cream canvas. Long-form pages share **`elevate-marketing-shell`** + typography tokens ([`PLAN-responsive-longform-typography.md`](../features/PLAN-responsive-longform-typography.md)). |
| **App shell** | `(dashboard)/`, `(admin)/` | Default `--primary` blue, neutral layers, existing sidebar/card patterns |
| **Auth** | `(auth)/` | Neutral + optional marketing canvas on **panels** only (no full marketing chrome) |

## 4. Primitives (shared components)

| Component | Path | Notes |
|-----------|------|------|
| Button | `src/components/ui/button.tsx` | Variants; marketing routes override primary CTA with utility classes where needed |
| Card | `src/components/ui/card.tsx` | Radius + border + optional elevation shadow |
| Input | `src/components/ui/input.tsx` | Border, focus ring, 8px-radius alignment |
| Badge | `src/components/ui/badge.tsx` | |

## 5. Quality pipeline (gstack)

For **CTO/Eng + Designer** review order, optional **`/plan-ceo-review`**, and repo gates, see **[`QUALITY_PIPELINE.md`](QUALITY_PIPELINE.md)** (single page; complements [`docs/AI_ORCHESTRATION.md`](../AI_ORCHESTRATION.md)).

## 6. Rollout checklist (when touching UI)

1. Decide surface: **marketing** vs **app** vs **auth**.
2. Prefer existing CSS variables + Tailwind semantic colors (`bg-layer-01`, `text-text-secondary`, …).
3. For marketing polish, read vendored `DESIGN.md` § relevant section, then map via `elevate-cursor-alignment.md`.
4. Interactive controls: follow [`INTERACTIVE_AFFORDANCES.md`](INTERACTIVE_AFFORDANCES.md) (pointer on clickable elements; disabled → `not-allowed`).
5. Route changes: follow [`NAVIGATION_LOADING.md`](NAVIGATION_LOADING.md) (segment `loading.tsx`, link pending UI where needed).
6. Run `pnpm verify`; check light/dark and focus states.

## 7. Backlog (iterate until done)

Use this as a working queue; check off in PRs or `memory-bank/tasks.md` when scoped.

| Priority | Area | Action |
|----------|------|--------|
| P1 | Marketing inner pages | ✅ Borders/grid tokens rolled across `(marketing)` routes; keep iterating on section alternation per page. |
| P2 | Dashboard content | ✅ Single bounded panels (`rounded-xl` + `divide-y` / hairline grid per [`DASHBOARD_UX_PRINCIPLES.md`](DASHBOARD_UX_PRINCIPLES.md)) — overview, library list, settings, studio, productions list; subscription callout stays dashed where needed. |
| P3 | Admin | ✅ Overview link tiles + waitlist / allowlist / catalog admin panels: `rounded-lg` + `shadow-ambient` on main panels. |
| P4 | Reference | Deferred — vendor a second `DESIGN.md` only after product decision (`§8` Future extensions). |
| P5 | Button API | ✅ `variant="marketing"` on `Button` / `buttonLinkClassName` (orange pill; use only under marketing chrome). |

## 8. Future extensions (optional)

- Add a second vendored `DESIGN.md` under `docs/design/third-party/` for a distinct surface (e.g. data-dense dashboard) — only after explicit product decision.
- Custom display font for marketing headings — subset + license review.
