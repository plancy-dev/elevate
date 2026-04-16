# Elevate — design reference (entry point)

This file exists at the **repository root** so coding and design agents that follow the [Stitch / awesome-design-md](https://github.com/VoltAgent/awesome-design-md) convention (`AGENTS.md` + **`DESIGN.md`**) can find a design anchor without hunting subfolders.

## Canonical documents

| Role | Path |
|------|------|
| **How we ship UI** (tokens, surfaces, backlog) | [`docs/design/SYSTEM.md`](docs/design/SYSTEM.md) |
| **Workflow** | [`docs/design/README.md`](docs/design/README.md) |
| **Token mapping** (reference → `globals.css`) | [`docs/design/elevate-cursor-alignment.md`](docs/design/elevate-cursor-alignment.md) |
| **Quality pipeline** (gstack: CTO/Eng + Designer + repo gates) | [`docs/design/QUALITY_PIPELINE.md`](docs/design/QUALITY_PIPELINE.md) |
| **External moodboard (neutral SaaS)** | Community packs like [Cal-style `DESIGN.md`](https://getdesign.md/cal/design-md) — use as **vocabulary** for calm neutrals; ship via [`docs/design/SYSTEM.md`](docs/design/SYSTEM.md) tokens + `globals.css`, not pixel-for-pixel copy. |
| **Visual contract** (marketing vs app accents, motion, radius) | [`docs/design/VISUAL_LANGUAGE_V2.md`](docs/design/VISUAL_LANGUAGE_V2.md) |
| **Dashboard UX** (lists, nav — avoid template clichés) | [`docs/design/DASHBOARD_UX_PRINCIPLES.md`](docs/design/DASHBOARD_UX_PRINCIPLES.md) |
| **Pointers & cursors** (links, tabs, buttons, selects — `globals.css` base layer) | [`docs/design/INTERACTIVE_AFFORDANCES.md`](docs/design/INTERACTIVE_AFFORDANCES.md) |
| **Route / nav loading** (`loading.tsx`, `useLinkStatus`, spinners) | [`docs/design/NAVIGATION_LOADING.md`](docs/design/NAVIGATION_LOADING.md) |
| **Vendored Cursor-inspired `DESIGN.md`** (full Stitch-style doc, MIT) | [`docs/design/third-party/cursor-awesome-design-md/DESIGN.md`](docs/design/third-party/cursor-awesome-design-md/DESIGN.md) |

The long-form inspiration lives under `docs/design/third-party/` so we can **sync from upstream** with `curl` (see [`docs/design/third-party/cursor-awesome-design-md/README.md`](docs/design/third-party/cursor-awesome-design-md/README.md)) and keep the root file small.

**Do not** duplicate the full vendored markdown here — one source of truth avoids drift.
