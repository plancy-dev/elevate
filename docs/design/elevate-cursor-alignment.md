# Elevate ↔ Cursor-inspired reference alignment

**Source of truth for shipped UI:** `src/app/globals.css` (`:root` / `.dark`) and Tailwind `@theme inline` mappings — IBM Carbon–leaning neutrals and `--primary` blue today.

**Inspiration doc (not authoritative for pixels):** [`third-party/cursor-awesome-design-md/DESIGN.md`](third-party/cursor-awesome-design-md/DESIGN.md) — warm cream palette, Cursor Orange `#f54e00`, oklab borders, CursorGothic / jjannon / berkeleyMono (see upstream for full detail).

Use this table to **translate** when refactoring: pick a Cursor role, map to an existing Elevate variable or add a **new** semantic variable (prefer one PR per concern: e.g. “marketing hero warmth” vs “dashboard card elevation”).

## Color mapping (incremental)

| Cursor concept (from DESIGN.md) | Elevate today (`globals.css`) | Notes / next step |
|----------------------------------|-------------------------------|-------------------|
| Cursor Cream `#f2f1ed` | `--marketing-canvas` + layout wrapper | Marketing locale layout; app shell unchanged |
| Cursor Dark `#26251e` | `--marketing-ink` / inherited text in `.elevate-marketing-chrome` | Dark mode: overridden in `.dark` for marketing tokens |
| Cursor Orange `#f54e00` | `--marketing-accent` / hero CTA overrides | Product `--primary` remains blue; dashboard unchanged |
| Surface 200–500 | `--surface`, `--surface-02`, `--layer-*` | Align naming over time; avoid duplicate meanings |
| Border Primary (oklab / 0.1) | `--border`, `--border-subtle` | Could add `--border-warm` later; oklab in CSS is fine |
| Error / Success | `--danger`, `--accent` | Cursor uses different hues; semantic roles already exist |

## Typography mapping

| Cursor (DESIGN.md) | Elevate today | Notes |
|--------------------|---------------|-------|
| CursorGothic display | `--font-geist-sans` (Geist) | Loading custom “Cursor-like” display font is optional; subset for marketing only to save bytes |
| berkeleyMono code | `--font-geist-mono` | Swap only if license and performance are acceptable |
| jjannon body | Geist sans | Marketing long-form could use a serif via `next/font` later |

## Spacing, radius, and components

- Cursor: **8px base**, fine-grained sub-steps — Elevate: use Tailwind spacing; prefer **multiples of 2** and a consistent section padding scale per surface (marketing vs dashboard).
- **Radius / shadow (in `globals.css`):** `--elevate-radius-*` → `@theme` `--radius-*`; `--elevate-shadow-ambient`, `--elevate-shadow-card` → utilities `shadow-ambient`, `shadow-card`. **Card** uses `rounded-lg` + `shadow-card`.
- **Marketing shell:** `.elevate-marketing-chrome` on `[locale]/(marketing)/layout.tsx`; primary CTAs use **`Button` / links with `variant="marketing"`** (`src/components/ui/button.tsx`).

## Where to apply first (suggested order)

1. **Marketing** (`src/app/[locale]/(marketing)/`): hero, section backgrounds, CTA color — lowest risk to app chrome.
2. **Dashboard** (`src/app/(dashboard)/`): cards, sidebar, tables — keep WCAG contrast; tie to existing CSS variables.
3. **Shared primitives** (if extracted): `Button`, `Card`, `Input` — after tokens stabilize.

Update this table as you complete each migration step.
