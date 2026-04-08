# Elevate design system structure

This document defines **how** we layer external references, tokens, and UI so agents and humans can extend the product consistently. It complements [`README.md`](README.md) (workflow) and [`elevate-cursor-alignment.md`](elevate-cursor-alignment.md) (token mapping).

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
| Feature CSS | e.g. `src/app/film-strip.css` imported from `globals.css` |

Product surfaces **keep IBM-style blue primary** inside the app shell; marketing uses **warm marketing accent** for primary CTAs where specified in components.

## 3. Surface modes

| Mode | Where | Behavior |
|------|-------|----------|
| **Marketing chrome** | `[locale]/(marketing)/` layout | Wrapper sets warm text/border/interactive tokens; header/footer/main share cream canvas |
| **App shell** | `(dashboard)/`, `(admin)/` | Default `--primary` blue, neutral layers, existing sidebar/card patterns |
| **Auth** | `(auth)/` | Neutral + optional marketing canvas on **panels** only (no full marketing chrome) |

## 4. Primitives (shared components)

| Component | Path | Notes |
|-----------|------|------|
| Button | `src/components/ui/button.tsx` | Variants; marketing routes override primary CTA with utility classes where needed |
| Card | `src/components/ui/card.tsx` | Radius + border + optional elevation shadow |
| Input | `src/components/ui/input.tsx` | Border, focus ring, 8px-radius alignment |
| Badge | `src/components/ui/badge.tsx` | |

## 5. Rollout checklist (when touching UI)

1. Decide surface: **marketing** vs **app** vs **auth**.
2. Prefer existing CSS variables + Tailwind semantic colors (`bg-layer-01`, `text-text-secondary`, …).
3. For marketing polish, read vendored `DESIGN.md` § relevant section, then map via `elevate-cursor-alignment.md`.
4. Run `pnpm verify`; check light/dark and focus states.

## 6. Backlog (iterate until done)

Use this as a working queue; check off in PRs or `memory-bank/tasks.md` when scoped.

| Priority | Area | Action |
|----------|------|--------|
| P1 | Marketing inner pages | Align `border-marketing-border-subtle` / alternating surfaces on `/product`, `/pricing`, `/blog`, `/contact` (same tokens as home). |
| P2 | Dashboard content | Apply `shadow-card` / `rounded-lg` to overview KPI tiles and library cards where not yet using `Card`. |
| P3 | Admin | `(admin)/` layout: keep neutral shell; optional subtle `shadow-ambient` on panels only. |
| P4 | Reference | Optionally vendor a second `DESIGN.md` (e.g. Vercel) for **dashboard** density — product decision first. |
| P5 | Button API | If orange CTA classes spread further, add `variant="marketing"` on `Button` / `IntlButtonLink`. |

## 7. Future extensions (optional)

- Add a second vendored `DESIGN.md` under `docs/design/third-party/` for a distinct surface (e.g. data-dense dashboard) — only after explicit product decision.
- Custom display font for marketing headings — subset + license review.
