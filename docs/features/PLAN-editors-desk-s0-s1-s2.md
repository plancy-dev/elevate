# PLAN: Editor's Desk — S0 / S1 / S2 (BUILD-ready checklists)

**Status:** PLAN re-locked (2026-04-27). Replaces the 04-24 attempt that was discarded before merging to main.
**Branch:** `feat/editors-desk-v3` (one PR, one commit per slice).
**Source of truth:** [`INIT-editors-desk-design-system.md`](./INIT-editors-desk-design-system.md) · [`ADR-011-design-system-v3-editors-desk.md`](../adr/ADR-011-design-system-v3-editors-desk.md) · [`docs/design/v3-creative/toc-ia-mapping.md`](../design/v3-creative/toc-ia-mapping.md).

**Q1-Q10 already locked.** This file is the actionable checklist; ADR-011 is the rationale.

---

## Cross-slice gates

Every slice's commit must pass:

```bash
pnpm typecheck          # 0 errors
pnpm lint               # 0 errors
pnpm test               # all unit tests green
pnpm build              # Turbopack succeeds
pnpm test:i18n          # locale parity test green
```

Slice-specific grep gates listed in each slice section.

---

## Lessons from the 04-24 attempt (must apply)

| # | Trap | Mitigation |
|---|------|-----------|
| **L1** | PostCSS 8.4.31 chokes on em-dash (`U+2014`) inside CSS comments — emits `Unknown word` and fails Turbopack build | All comments in `tokens.css` and `globals.css` use **ASCII hyphen only**. No em-dash, no en-dash, no smart quotes. |
| **L2** | `@theme { --shadow-*: initial; }` wipes the namespace and breaks ~40 callers of `shadow-card` / `shadow-md` immediately | S0 keeps **legacy v2 token shims** (e.g. `--shadow-card: none`, `--primary: var(--vermilion-600)`) so utility names compile but values resolve to v3. Hard wipe lands in S6 after callers are zero. |
| **L3** | Modal/CommandBar need framer-motion, but `src/components/ui/modal.tsx` is blocked by ESLint `no-restricted-imports` rule | Modal lives in `src/components/desk/Modal.tsx` (allowed by the path allowlist). The ui/modal.tsx file becomes a thin re-export so existing callers keep working. |
| **L4** | Removing `next/font/google` while `${geistSans.variable}` references remain breaks SSR | layout.tsx purges all font-variable className references; body className uses Tailwind utility (`font-body` from `@theme inline`). |
| **L5** | Deleting `src/lib/design-system-classes.ts` breaks 3 callers (`studio-productions-forms`, `studio-send-to-productions`, `draft-template-manage-dialog`) | S0 stubs the file (`export const modalPanelClassName = ""`); S1 migrates the 3 callers to inline classes, then deletes the file. |

---

## S0 — Tokens & Fonts + Archive (L2, 1 commit)

> **Goal:** Replace `globals.css` with v3 + legacy shim. Add `tokens.css`. Wire fonts. Archive 7 v2 docs. Remove `film-strip.css`. Stub `design-system-classes.ts`. Add ESLint framer-motion guard. Install 6 deps. **No other source files touched.**

### S0.1 — Pre-cleanup (archive + delete)

- [ ] Create `memory-bank/archive/design-v2/` with `README.md` linking to `ADR-011`.
- [ ] `git mv` (history-preserving):
  - [ ] `docs/design/VISUAL_LANGUAGE_V2.md` → `memory-bank/archive/design-v2/VISUAL_LANGUAGE_V2.md`
  - [ ] `docs/design/DASHBOARD_UX_PRINCIPLES.md` → same dir
  - [ ] `docs/design/PLAN_VISUAL_LANGUAGE_V2_ROLLOUT.md` → same dir
  - [ ] `docs/design/DESIGN_UX_AUDIT_REPORT.md` → same dir
  - [ ] `docs/design/INTERACTIVE_AFFORDANCES.md` → same dir
  - [ ] `docs/design/audit-screenshots/` → same dir
  - [ ] `memory-bank/creative-apple-tier-visual-system.md` → same dir
- [ ] `rm src/app/film-strip.css` and remove `@import "./film-strip.css"` from `globals.css`.
- [ ] **Stub** (don't delete) `src/lib/design-system-classes.ts` to `export const modalPanelClassName = "";` with `@deprecated` JSDoc. (3 callers will be migrated in S1.)
- [ ] Update doc links pointing to v2 → ADR-011 in: `AGENTS.md`, `README.md`, `memory-bank/README.md`, `docs/design/README.md`, `docs/design/SYSTEM.md`. (CLAUDE.md inherits via `@AGENTS.md`.)

### S0.2 — Install dependencies

```bash
pnpm add framer-motion cmdk @radix-ui/react-dialog @radix-ui/react-popover @radix-ui/react-tooltip @react-aria/focus
```

- [ ] Confirm `package.json` has 6 new entries. `pnpm-lock.yaml` updated.
- [ ] Note versions in `memory-bank/techStack.md`.

### S0.3 — Font loading (`src/app/layout.tsx`)

- [ ] Remove `import { Geist, Geist_Mono } from "next/font/google"` and the two font instances.
- [ ] Add to `<head>` (constant `FONTS_CSS_HREF`):
  ```html
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
  <link rel="preload" as="style" href={FONTS_CSS_HREF} />
  <link rel="stylesheet" href={FONTS_CSS_HREF} />
  ```
  with `FONTS_CSS_HREF = "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..900&family=Geist:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"`.
- [ ] Remove `${geistSans.variable} ${geistMono.variable}` from `<html className>`.
- [ ] Set `<body className>` to `min-h-screen bg-paper-50 font-body text-ink-900 antialiased`.

### S0.4 — Create `src/styles/tokens.css`

ASCII-only comments. Contents per ADR-011 §1+§2:

- Ink (5 stops), paper (3 stops), vermilion (2 stops), semantic (ok/warn/err).
- Typography (`--font-display/body/mono`), radius (0/2px/full), motion (1 easing + 3 durations), 4pt space scale, layout (`--toc-width`, `--toc-rail-width`), measure cap.
- Per-locale CJK fallback overrides (`[lang="ko"]`, `[lang="ja"]`, `[lang="zh-CN"]`, `[lang="zh-TW"]`) — mapped to Noto Serif * for display, system sans (Pretendard / Hiragino / PingFang) for body.
- Dark theme tokens under `[data-theme="dark"]` — defined for forward-compat, not toggled until S7.

### S0.5 — Rewrite `src/app/globals.css`

ASCII-only comments. Structure:

1. `@import "tailwindcss"; @import "../styles/tokens.css";`
2. **Legacy v2 shim block** — re-declare `--background`, `--foreground`, `--surface`, `--layer-01..03`, `--field`, `--border`, `--border-subtle`, `--text-primary/secondary/tertiary/on-color`, `--primary`, `--interactive`, `--focus`, `--highlight`, `--danger`, `--warning`, `--info`, `--accent`, `--marketing-canvas/ink/accent/glow/border-subtle`, `--elevate-radius-*`, `--elevate-shadow-card/ambient`, `--elevate-prose-*`, `--elevate-marketing-*`, `--elevate-cv-list-row-intrinsic`. All point to v3 values (vermilion replaces blue, paper replaces white, ink replaces gray, shadows resolve to `none`, radii to `0`).
3. `@theme inline { ... }` — bridge v3 + v2 names into Tailwind utilities.
4. `@utility rule-{t,r,b,l}`, `@utility measure`, `@utility font-display-opsz`.
5. `@keyframes rule-draw` + `.rule-draw` class.
6. `.elevate-marketing-chrome { /* no-op */ }` (Q2 kills marketing chrome split; class kept until S5 sweep).
7. `.elevate-marketing-shell`, `.elevate-cv-list-item`, `.prose-blog` — preserved (callers in `[locale]/(marketing)/*` and blog).
8. `@layer base { /* pointer affordances */ }`.
9. `body { background: var(--paper-50); ... }` + `::selection { background: var(--vermilion-100); }` + `::-webkit-scrollbar` thin styling.

### S0.6 — Verify Tailwind v4 still compiles

- [ ] `pnpm build` (Turbopack) succeeds.
- [ ] No new "Unknown utility" errors. (If they occur, the shim missed a token — add it.)
- [ ] If the shim approach fails entirely, fall back to `tailwind.config.ts` overrides — decided at runtime.

### S0.7 — ESLint framer-motion guard

Edit `eslint.config.mjs`:

```js
const FRAMER_MOTION_RESTRICTION = {
  rules: {
    "no-restricted-imports": [
      "error",
      {
        paths: [
          { name: "framer-motion", message: "ADR-011 §6: import only from src/components/desk/** or named micro-interaction paths." },
          { name: "framer-motion/dom", message: "ADR-011 §6 path-restricted." },
        ],
      },
    ],
  },
};
```

Allowlist (override block):
- `src/components/desk/**/*.{ts,tsx}`
- `src/components/marketing/publish-confirm.{ts,tsx}` (S4 future)
- `src/hooks/use-reduced-motion.{ts,tsx}` (future)

### S0.8 — Smoke + acceptance

- [ ] `pnpm verify` green (lint + typecheck + unit + build).
- [ ] `pnpm test:i18n` green.
- [ ] `pnpm dev` — visit `/`, `/dashboard`, `/dashboard/productions`, `/dashboard/productions/[episodeId]/editor`, `/ko`, `/ja`, `/zh-CN`, `/zh-TW`. Layout intact (utility names still compile via shim). Colors render in vermilion + paper + ink.
- [ ] Capture Lighthouse LCP/CLS for `/` and `/dashboard` into `docs/design/v3-progress/s0/baseline.md` (post-merge operator task; placeholder file created in S0).
- [ ] Single commit: `feat(design): editor's desk v3 — tokens, fonts, archive v2, eslint guard (S0)`.

---

## S1 — Primitives (L3, 1 commit)

> **Goal:** Create `src/components/desk/{Plate, Mark, ShortcutBadge, index}.tsx`. Rewrite all 10 `src/components/ui/*` primitives to v3 spec. Migrate 3 callers off `design-system-classes.ts` and delete the file.

### S1.1 — Create `src/components/desk/`

- [ ] `Plate.tsx` — see ADR-011 §4. Props: `selected?: boolean`, `padding?: "none"|"sm"|"md"|"lg"`. Selection bar = `before:` pseudo, 3px vermilion, left edge.
- [ ] `Mark.tsx` — glyph set as TS const map (`paragraph: ¶`, `section: §`, `pilcrow: ⁋`, `play: ▸`, `bullet: •`, `emdash: —`, `endash: –`). `aria-hidden`. Display font.
- [ ] `ShortcutBadge.tsx` — `keys: ReadonlyArray<string>`, `density: "inline"|"block"`. Mono 11/12px uppercase tracking-0.04em.
- [ ] `index.ts` — barrel exports for the three.
- [ ] **Also include here:** `Modal.tsx` based on `@radix-ui/react-dialog`. Centered 640px desktop, slide-up bottom sheet on mobile. Header `display-md` + `rule-b`. ESC corner mono badge. Path placement avoids the ESLint framer-motion block.

### S1.2 — Rewrite `src/components/ui/button-styles.ts` and `button.tsx`

- [ ] Variants: `primary` (vermilion fill + paper text + ink-900 border, hover thickens border to 2px inset via `ring-1 ring-inset`), `secondary` (paper fill, ink-900 border), `tertiary` (paper fill, ink-300 border, hover ink-900), `ghost` (transparent, hover bottom rule), `danger` (vermilion border + vermilion text on paper, hover swap), `marketing` (alias of `primary`, deprecated JSDoc).
- [ ] Base: `inline-flex items-center justify-center gap-3 border rounded-sm font-body font-[500] leading-[1.3] tracking-[0.01em]` + `transition-[background-color,color,border-color,box-shadow] duration-[80ms] [transition-timing-function:var(--ease-editorial)]` + focus ring vermilion.
- [ ] `Button` props: add `shortcut?: ReadonlyArray<string>` and `loadingLabel?: string`. When `shortcut` present, button uses `justify-between` and renders `<ShortcutBadge>` on the right.
- [ ] `isLoading` renders mono `loadingLabel` text (default `"…"`) — no spinner.
- [ ] `ButtonLink` mirrors the Button API, plus a pending overlay using `useLinkStatus` that renders a mono ellipsis (no spinner SVG).

### S1.3 — Rewrite `src/components/ui/input.tsx`

- [ ] No box. Class: `h-10 w-full bg-transparent px-0 text-[14px] text-ink-900 caret-vermilion-600 border-b border-ink-300 focus:outline-none focus:border-b-2 focus:border-vermilion-600 placeholder:text-ink-500 placeholder:italic disabled:opacity-40 disabled:cursor-not-allowed font-body transition-[border-color,border-width] duration-[80ms] [transition-timing-function:var(--ease-editorial)]`.
- [ ] Caller pattern (documented in JSDoc): label above input as `<label class="font-body text-[12px] uppercase tracking-[0.08em] text-ink-500">`.

### S1.4 — Rewrite `src/components/ui/textarea.tsx`

- [ ] Same approach as Input (bottom rule), `min-h-[5rem]`, `py-2` (top spacing for content).

### S1.5 — Rewrite `src/components/ui/modal.tsx` as thin re-export

- [ ] Import `Modal` from `@/components/desk/Modal`. Re-export with the existing prop signature (`open`, `onClose`, `title`, `description`, `children`, `className`, `size`, `stackClassName`, `titleId`) so all current callers (~15 files) keep working without edits.

### S1.6 — Rewrite `src/components/ui/select.tsx` and `field-select.tsx`

- [ ] Trigger: `border-b border-ink-300` instead of box; focus `border-vermilion-600` 2px.
- [ ] Content: `border border-ink-700 bg-paper-100 rounded-none`; item hover `bg-paper-0`; check icon `text-vermilion-600`.
- [ ] FieldSelect: native `<select>` with custom chevron — keep API; swap classes to bottom-rule pattern.

### S1.7 — Rewrite `src/components/ui/badge.tsx`

- [ ] Variants: `default` (ink-700 border + paper-100 bg + ink-900 text), `active` (vermilion-600 fill + paper-50 text), `muted` (ink-500 text only, no border). Map legacy `blue/green/red/warm-gray` aliases:
  - `blue` → `default`, `green` → `default`, `red` → `active` with vermilion (since `red` was used for danger states), `warm-gray` → `muted`.
- [ ] Class: `inline-flex items-center px-2 py-0.5 rounded-sm font-mono text-[11px] uppercase tracking-[0.02em]`.

### S1.8 — Restyle `src/components/ui/app-toaster.tsx`

- [ ] Sonner `theme="light"` always (S7 wires dark).
- [ ] `toastOptions.classNames`: panel = `"rounded-none border border-ink-700 bg-paper-100 text-ink-900"`. Error variant = `"border-l-[3px] border-l-vermilion-600"`.
- [ ] Remove `richColors` (collapses palette away from monochrome).

### S1.9 — Rewrite `src/components/ui/card.tsx` as Plate adapter

- [ ] Re-export `Plate` (and aliases `Card = Plate`, `CardHeader = PlateHeader`, `CardContent = ({className, ...}) => <div className={cn("px-4 py-3", className)} {...} />`).
- [ ] Add `@deprecated` JSDoc pointing to `@/components/desk/Plate`. S4-S6 call-site sweeps move imports.

### S1.10 — Migrate callers off `design-system-classes.ts`

3 callers need replacement of `modalPanelClassName`:

- [ ] `src/components/dashboard/studio-productions-forms.tsx` (2 occurrences)
- [ ] `src/components/dashboard/studio-send-to-productions.tsx`
- [ ] `src/components/dashboard/draft-template-manage-dialog.tsx`

Replacement: inline `"border border-ink-700 bg-paper-100"`.

- [ ] After all 3 are migrated and `rg "design-system-classes" src` returns 0 hits, **delete** `src/lib/design-system-classes.ts`.

### S1.11 — S1 acceptance gates

- [ ] `pnpm verify` green.
- [ ] `pnpm test:i18n` green.
- [ ] `rg "rounded-(lg|xl)" src/components/ui src/components/desk` — **0 matches**.
- [ ] `rg "shadow-(sm|md|lg|xl|2xl|inner|card|ambient)" src/components/ui src/components/desk` — **0 matches**.
- [ ] `rg "design-system-classes" src` — **0 matches**.
- [ ] Visual sanity: `pnpm dev`, manual click-through on `/login`, `/`, `/dashboard`, `/dashboard/productions/new`, any modal-using surface (e.g. studio handoff dialog).
- [ ] Single commit: `feat(desk): primitives — Plate, Mark, ShortcutBadge, ui/* rewrite (S1)`.

---

## S2 — Shell (L3, 1 commit)

> **Goal:** Replace dashboard sidebar with `desk/TOC.tsx`. Replace ad-hoc page headers with `desk/Masthead.tsx`. Add `desk/CommandBar.tsx`. Wire `Cmd+K`, `Cmd+\`, `g→s/t/p` shortcuts. Retire `dashboard/sidebar.tsx`, `dashboard/admin-sidebar.tsx`, and `dashboard-nav-link.tsx`.

### S2.0 — CREATIVE precondition (already met)

- [x] TOC IA locked → [`docs/design/v3-creative/toc-ia-mapping.md`](../design/v3-creative/toc-ia-mapping.md).

### S2.1 — `src/components/desk/TOC.tsx`

- [ ] 240px fixed left, `bg-paper-100`, `rule-r`. Roman numerals as section titles (Fraunces, opsz 24). Sub-items as small caps (`font-body text-[13px] uppercase tracking-[0.08em] text-ink-500`).
- [ ] Active sub-item: vermilion `•` `before:` pseudo, weight 500, color ink-900. No background wash.
- [ ] Collapse via `Cmd+\` toggling a `collapsed` boolean (URL search param `?toc=collapsed` for SSR persistence). Collapsed width 48px; only Roman numerals visible.
- [ ] Mobile breakpoint (`< 1024px`): horizontal strip with chips opening a Radix Dialog bottom sheet for sub-items.
- [ ] Server-render the section list with role-gated visibility (Admin sub-item filtered out for non-admins).
- [ ] i18n keys per CREATIVE doc § 7 — added to `messages/{en,ko,ja,zh-CN,zh-TW}.json`. `pnpm test:i18n` ensures parity.
- [ ] Active-match resolver = longest-prefix (CREATIVE doc §3).

### S2.2 — `src/components/desk/Masthead.tsx`

- [ ] Props: `title: string`, `eyebrow?: string` (small caps mono above), `actions?: ReactNode` (right-aligned cluster), `meta?: ReactNode` (mono ID/timestamp under the title).
- [ ] Class: `flex items-end justify-between gap-6 rule-b pb-6 mb-8`.
- [ ] Title: `<h1 className="font-display-opsz text-[48px] leading-[1.05] text-ink-900">`.
- [ ] Replace ad-hoc page-title `<h1>` blocks in `/dashboard` route group page files (sweep ~12 files in S2 — list in commit body).

### S2.3 — `src/components/desk/CommandBar.tsx`

- [ ] cmdk + Radix Dialog. Bottom sheet: `fixed inset-x-0 bottom-0 max-h-[50vh] border-t border-ink-700 bg-paper-50`.
- [ ] Slide up via framer-motion `motion.div` (allowed by ESLint allowlist). 160ms `--ease-editorial`.
- [ ] Result list `flex-col-reverse` so the most-relevant row sits closest to the input.
- [ ] Item rows: `font-mono text-[12px]` with `01 ▸ Label   Cmd+↵`.
- [ ] Result groups (top of list when reversed = bottom visually): Routes (g→s/t/p targets), Recent episodes, Help.
- [ ] Closes on `Esc` (Radix default) and click outside.

### S2.4 — `useShortcut` hook (`src/hooks/use-shortcut.ts`)

- [ ] Listens for combos: `Cmd+K` (open CommandBar), `Cmd+\` (toggle TOC collapse), `g→s/t/p` (sequence within 750ms; only when no input/textarea has focus).
- [ ] Disabled inside `<input>`, `<textarea>`, `[contenteditable]`, or when an open Modal has focus (use `@react-aria/focus` `FocusScope` to detect).
- [ ] Server-rendered TOC + Masthead emit `data-shortcut="cmd+\\"` on the relevant elements; the hook reads them for self-documentation (no global registry needed).

### S2.5 — Replace `(dashboard)/layout.tsx` chrome

- [ ] Mount `<TOC user={...} role={...} />` instead of `<Sidebar>`.
- [ ] Mount `<CommandBar>` once at layout level.
- [ ] Mount `<Masthead>` per page (each page passes its own title/meta).

### S2.6 — Delete the legacy

- [ ] `rm src/components/dashboard/sidebar.tsx`.
- [ ] `rm src/components/dashboard/dashboard-nav-link.tsx`.
- [ ] `rm src/components/dashboard/admin-sidebar.tsx`.
- [ ] Update `(admin)/layout.tsx` to reuse `<TOC>` (filtered to House.Admin only).

### S2.7 — i18n + tests

- [ ] Add 17 new keys per CREATIVE doc §7. `pnpm test:i18n` green.
- [ ] Optional: keyboard E2E spec under `tests/e2e/keyboard-shortcuts.spec.ts` (skipped on CI by default; run with `--grep keyboard`).

### S2.8 — S2 acceptance gates

- [ ] `pnpm verify` green.
- [ ] `pnpm test:i18n` green.
- [ ] `rg "from \"@/components/dashboard/sidebar\"" src` — 0 matches.
- [ ] `rg "from \"@/components/dashboard/admin-sidebar\"" src` — 0 matches.
- [ ] Manual: keyboard-only navigation works (`Cmd+K` → search → `Enter`; `Cmd+\` toggles TOC; `g s` jumps to Library).
- [ ] Mobile (Chrome DevTools 375px): TOC strip + chip sheet renders.
- [ ] Single commit: `feat(desk): TOC + Masthead + CommandBar + keyboard shortcuts (S2)`.

---

## Slices S3-S7 (preview, not yet detailed)

| Slice | Scope | Migration count |
|---|---|---|
| **S3 ColumnTimeline (signature)** | `desk/ColumnTimeline/{Column,Playhead,Rule}.tsx`. Stress test with 24 scenes. Integrate into Studio Phase 2 editor (`src/app/(dashboard)/dashboard/productions/[episodeId]/editor/page.tsx`) — DSL/server unchanged. | 1 new component, ~3 file edits in editor route |
| **S4 Scene/Publish + Phase 2 sweep** | FramePicker. PublishScheduler reskin. `src/components/dashboard/editor/*` class-name sweep (v2 utilities → v3 utilities). `scene-image-gallery` → embeds ColumnTimeline. | ~12 files |
| **S5 Marketing + Auth** | `[locale]/(marketing)/*`, `(auth)/*`, `elevate-logo` typographic version. Sweep 3 gradient files. Remove `.elevate-marketing-chrome` no-op (was preserved in S0). | ~15 files |
| **S6 Admin + Billing + LOCK** | `(admin)/*`, `dashboard/billing/*`, `dashboard/team`. Final sweep: every `rounded-md/lg/xl` → `rounded-none`. Every `shadow-*` → removed. **Lock the namespaces** in `globals.css` (`@theme { --shadow-*: initial; --background-image-*: initial; }`). Drop the v2 token shim. | ~20 files |
| **S7 Dark theme (optional)** | Wire `[data-theme="dark"]` to `next-themes` toggle. Verify the 4 token swaps render correctly. | 2-3 files |

Each remaining slice gets its own PLAN file when its predecessor merges.

---

## Risks summary

| Risk | Slice | Mitigation |
|---|---|---|
| Tailwind build fails after S0 | S0 | Legacy v2 token shim. If still fails, fall back to `tailwind.config.ts` overrides. |
| ColumnTimeline performance with 24 scenes | S3 | Virtualization deferred; HTML5 horizontal scroll suffices (each column is 280px so 24 = 6720px wide, native browser handles). |
| Studio Phase 2 editor regression after sweep | S4 | Class-name sweep only (no logic changes). Manual smoke + existing `tests/e2e/auth-*` + `live-phase*` cover the editor path. |
| Marketing CTA color change visible to public | S5 | CHANGELOG entry + (optional) blog post. The vermilion replaces orange directly; same contrast ratio. |
| Dark theme regressions | S7 | Optional slice; can defer indefinitely. Toggle stays disabled until S7 ships. |
