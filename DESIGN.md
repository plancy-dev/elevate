# Elevate — design reference (entry point)

This file exists at the **repository root** so coding and design agents that follow the [Stitch / awesome-design-md](https://github.com/VoltAgent/awesome-design-md) convention (`AGENTS.md` + **`DESIGN.md`**) can find a design anchor without hunting subfolders.

## Canonical documents

| Role | Path |
|------|------|
| **How we ship UI** (tokens, surfaces, backlog) | [`docs/design/SYSTEM.md`](docs/design/SYSTEM.md) |
| **Workflow** | [`docs/design/README.md`](docs/design/README.md) |
| **Token mapping** (reference → `globals.css`) | [`docs/design/elevate-cursor-alignment.md`](docs/design/elevate-cursor-alignment.md) |
| **Vendored Cursor-inspired `DESIGN.md`** (full Stitch-style doc, MIT) | [`docs/design/third-party/cursor-awesome-design-md/DESIGN.md`](docs/design/third-party/cursor-awesome-design-md/DESIGN.md) |

The long-form inspiration lives under `docs/design/third-party/` so we can **sync from upstream** with `curl` (see [`docs/design/third-party/cursor-awesome-design-md/README.md`](docs/design/third-party/cursor-awesome-design-md/README.md)) and keep the root file small.

**Do not** duplicate the full vendored markdown here — one source of truth avoids drift.
