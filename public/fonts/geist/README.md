# Geist Font (vendored)

Source: [`geist` npm package](https://www.npmjs.com/package/geist) → Vercel + basement.studio
License: SIL Open Font License 1.1 (see `LICENSE.txt`)

## Why vendored here

1. **Claude Design tool upload** — `public/fonts/geist/` is a stable path to drag
   into "Upload fonts" so the generated design system previews with real Geist
   instead of fallback web fonts.
2. **Explicit version pinning** — mirrors `geist@x.y.z` from `package.json`.
   Refresh with `pnpm fonts:sync` (runs `scripts/sync-geist-fonts.sh` which
   copies `.woff2` from `node_modules/geist/dist/fonts/geist-{sans,mono}/`
   into `sans/` and `mono/`, plus the OFL license).
3. **Future self-hosting option** — if we ever replace `next/font/google`
   with `next/font/local` (see `src/app/layout.tsx`), these are the source
   files.

## Current runtime loading

`src/app/layout.tsx` still uses `next/font/google` (`Geist`, `Geist_Mono`).
Next.js fetches + self-hosts at build time, so these vendored files are **not**
loaded in production today. They exist purely as a managed artifact. Switch to
`next/font/local` pointing at `/fonts/geist/sans/Geist-Variable.woff2` if you
want to drop the Google Fonts fetch entirely.

## Layout

```
public/fonts/geist/
├── LICENSE.txt         # OFL 1.1
├── sans/               # Geist Sans — variable + all static weights
└── mono/               # Geist Mono — variable + all static weights
```

Each folder ships both a variable font (`*-Variable.woff2`) and static
weight files (Thin → UltraBlack, regular + italic). For production, the
variable files alone cover every weight.
