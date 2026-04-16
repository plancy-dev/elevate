# Elevate ↔ Cal.com-inspired reference alignment

**Source of truth for shipped UI:** `src/app/globals.css` (`:root` / `.dark`) and Tailwind `@theme inline` — IBM-style `--primary` blue in the app shell, Geist sans, existing layer tokens.

**Inspiration doc (not authoritative for pixels):** root [`DESIGN.md`](../../DESIGN.md) (Cal.com moodboard) and vendored CLI snapshot [`third-party/cal-getdesign/DESIGN.md`](third-party/cal-getdesign/DESIGN.md). See [What is DESIGN.md?](https://getdesign.md/what-is-design-md) for the getdesign.md workflow.

Use this table to **translate** Cal concepts into Elevate variables or Tailwind semantic classes. Prefer one PR per surface (e.g. “card shadow token” vs “marketing hero type scale”).

## Color mapping

| Cal concept (DESIGN.md) | Elevate today | Notes |
|-------------------------|---------------|--------|
| Charcoal `#242424` (headings, dark CTA) | `--text-primary` `#161616` (light) | Close neutral family; no need to match `#242424` exactly in app. |
| Mid Gray `#898989` | `--text-tertiary` / `--text-secondary` | Map copy hierarchy to semantic text roles. |
| Pure White `#ffffff` | `--layer-01`, `--background` | Cards and page canvas. |
| Link Blue `#0099ff` | `--interactive`, inline links | App links already use interactive blue; marketing may use `text-interactive` + underline utilities. |
| Focus ring `#3b82f6` / 50% | `--focus` + `focus-visible:` rings | Implemented on `Button`, `FieldSelect`; keyboard-only emphasis. |

**Do not** strip Elevate’s primary blue from dashboard CTAs to match Cal’s charcoal-only marketing buttons — that would break product chrome consistency ([`SYSTEM.md`](SYSTEM.md)).

## Elevation (shadows)

| Cal concept | Elevate today | Notes |
|-------------|---------------|--------|
| Ring + contact + diffuse stack | `--elevate-shadow-card` on `:root` / `.dark` | Tuned toward Cal-style multi-layer depth; `Card` uses `shadow-card`. |
| Hairline “border” via `0 0 0 1px` shadow | Combined with real `border-border-subtle` on `Card` | Hybrid: ring shadow + subtle border reads clearly in light/dark. |

## Typography

| Cal concept | Elevate today | Notes |
|-------------|---------------|--------|
| Cal Sans display / Inter body | **Geist Sans** (`--font-geist-sans`) | Do not add Cal Sans without license + subset plan; Geist stays the product default. |
| Tight display headlines | Marketing/dashboard use existing `clamp()` tokens in `globals.css` | Adjust per route in scoped classes, not global font swap. |

## Where to apply first

1. **Shared elevation:** `globals.css` `--elevate-shadow-card` — affects all `Card` surfaces.
2. **Marketing pages:** Section spacing and monochrome type hierarchy — align with root `DESIGN.md` §5–6 without changing dashboard chrome.
3. **Dashboard:** Neutrals and list patterns — [`DASHBOARD_UX_PRINCIPLES.md`](DASHBOARD_UX_PRINCIPLES.md) + this doc’s shadow/text mapping.

Update this table when tokens or the root `DESIGN.md` change materially.
