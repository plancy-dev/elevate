# Cursor-inspired reference (awesome-design-md)

Upstream: [VoltAgent/awesome-design-md — `design-md/cursor/`](https://github.com/VoltAgent/awesome-design-md/tree/main/design-md/cursor/)

This folder vendors **`DESIGN.md`** only (MIT-licensed; see repository [LICENSE](https://raw.githubusercontent.com/VoltAgent/awesome-design-md/main/LICENSE)). It is **not** Cursor’s official design system; colors and spacing are approximate and intended as **agent-readable** inspiration.

## Files here

| File | Role |
|------|------|
| `DESIGN.md` | Stitch-style design doc for AI-assisted UI work |

Optional upstream companions (not vendored by default; open in browser or save locally if needed):

- [`preview.html`](https://raw.githubusercontent.com/VoltAgent/awesome-design-md/main/design-md/cursor/preview.html) — light token catalog
- [`preview-dark.html`](https://raw.githubusercontent.com/VoltAgent/awesome-design-md/main/design-md/cursor/preview-dark.html) — dark token catalog

## Sync from upstream

From the repo root:

```bash
curl -fsSL "https://raw.githubusercontent.com/VoltAgent/awesome-design-md/main/design-md/cursor/DESIGN.md" \
  -o docs/design/third-party/cursor-awesome-design-md/DESIGN.md
```

Commit the diff when you intentionally refresh the reference.

## Usage in Elevate

- **Do not** replace Elevate product tokens wholesale from this file.
- **Do** use [`docs/design/elevate-cursor-alignment.md`](../elevate-cursor-alignment.md) to map Cursor concepts → `src/app/globals.css` / Tailwind `@theme` tokens, then change UI in small PRs (marketing vs dashboard — see [`docs/design/README.md`](../README.md)).
