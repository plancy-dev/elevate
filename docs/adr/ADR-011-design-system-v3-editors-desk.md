# ADR-011: Design System v3 — "Editor's Desk"

**Status:** Accepted (2026-04-27)
**Number history:** Originally drafted as ADR-010 on 2026-04-24; that work was discarded before merging to main, and the 010 slot was reused for [`ADR-010-fullscreen-timeline-editor`](ADR-010-fullscreen-timeline-editor.md). This redraft uses 011 to avoid collision. Content + decisions are identical to the 04-24 draft except for the path change captured in §4.
**Branch:** `feat/editors-desk-v3` (merged via single PR; each slice = one commit on the branch).
**Supersedes:** [`docs/design/VISUAL_LANGUAGE_V2.md`](../design/VISUAL_LANGUAGE_V2.md) · [`DASHBOARD_UX_PRINCIPLES.md`](../design/DASHBOARD_UX_PRINCIPLES.md) · [`memory-bank/creative-apple-tier-visual-system.md`](../../memory-bank/creative-apple-tier-visual-system.md). v2 docs move to `memory-bank/archive/design-v2/` in S0.
**Related:**
[INIT-editors-desk-design-system.md](../features/INIT-editors-desk-design-system.md) ·
[ADR-003-studio-productions-mvp.md](ADR-003-studio-productions-mvp.md) ·
[ADR-009-studio-image-providers-and-keyframes.md](ADR-009-studio-image-providers-and-keyframes.md) ·
[ADR-010-fullscreen-timeline-editor.md](ADR-010-fullscreen-timeline-editor.md) (Studio Phase 2 — separate concern; v3 reskins its UI in S4 without touching the DSL or worker)

## Context

Elevate's surface is an AI content workshop for English-speaking solo creators. The product's core tension is "creator's atelier" vs. "automation factory"; the UI must resolve that by making the craft visible. The existing v2 visual contract (IBM blue primary, marketing orange accent, rounded corners, soft shadows) reads like a generic SaaS console — it undersells the editorial nature of what the product actually produces (scripts, scene boards, timelines, captions).

The new positioning concept is **"The Editor's Desk"** — a 20th-century typesetting room's precision, translated into a modern keyboard workflow. Every screen should read as a typeset broadsheet being composed in real time.

The key constraint: "exactly one mood" (quiet, precise, confident). No delight. No playful micro-animations. No soft shadows. The product earns trust through composure, not decoration.

The Studio Phase 2 fullscreen editor (ADR-010) has shipped to main. v3 reuses its DSL, worker, and FFmpeg pipeline unchanged; only the chrome (timeline track, header, sidebar) is reskinned by S3 (ColumnTimeline) and S4 (sweep).

## Decision

### 1. Foundational tokens (replace `src/app/globals.css` + add `src/styles/tokens.css`)

Three color families, one chromatic accent:

```css
:root {
  /* Ink + paper - the base duality */
  --ink-900: #0A0A0A;
  --ink-700: #2B2B2B;
  --ink-500: #6B6B6B;
  --ink-300: #BDBDBD;
  --ink-100: #E6E2DA;

  --paper-50:  #FAF7F0;
  --paper-100: #F3EEE1;
  --paper-0:   #FFFFFF;

  /* Signature - the only chromatic color */
  --vermilion-600: #D4341C;
  --vermilion-100: #F9D9D1;

  /* Semantic - monochromatic by default */
  --ok:   #2E7D48;
  --warn: #B8830E;
  --err:  var(--vermilion-600);
}
```

Vermilion is used only for: (1) active selection, (2) primary CTA, (3) editorial marks (cursor, playhead, current-scene indicator). Never decorative.

**Radius (near-zero):**

```css
--radius-0:    0;
--radius-1:    2px;
--radius-full: 9999px;
```

**Motion (one easing, three durations):**

```css
--ease-editorial: cubic-bezier(0.2, 0, 0, 1);
--dur-instant: 80ms;
--dur-quick:  160ms;
--dur-page:   240ms;
```

**Banned at the config level:** `box-shadow` utilities (S6 lock; S0 keeps a `none` shim), `rounded-(md|lg|xl|2xl|3xl)` (S6 lock; S0 collapses default values to `0`), every gradient utility (S5 manual sweep). Separation between layers is a 1px `--ink-100` rule.

### 2. Typography — three faces, no more

```css
--font-display: "Fraunces", "Times New Roman", serif;
--font-body:    "Geist", ui-sans-serif, system-ui;
--font-mono:    "JetBrains Mono", ui-monospace;
```

Display type (>=48px) sets `font-variation-settings: "opsz" 144`. Prose column measure capped at 66ch via `.measure`.

**CJK fallback (per-locale `[lang="ko|ja|zh-CN|zh-TW"]` overrides in `tokens.css`):** Display uses Noto Serif KR/JP/SC/TC; body uses platform sans (Pretendard / Hiragino / PingFang).

### 3. Signature component (exactly one) — **The Columnar Timeline**

Every scene is a vertical typographic column, 280px wide, separated from the next column by a single 1px vertical rule. Scenes read like stanzas on a page.

- Horizontally scrollable. Radius 0, shadow 0.
- **Playhead:** 2px vermilion vertical line with a Fraunces `▸` glyph at the top; rotates 0° → 90° when playback begins.
- **Reorder:** drag snaps instantly — no transition, no physics.
- **Cannot be replaced** with a conventional filmstrip or horizontal-bar timeline.
- **Stress test during BUILD:** 24-scene dataset; verify horizontal scroll, keyboard navigation, focus ring clarity, playhead scrub at 60fps.

**Studio Phase 2 integration (S3+S4):** ColumnTimeline replaces the timeline track UI inside `src/app/(dashboard)/dashboard/productions/[episodeId]/editor/`. The editor's DSL v3 (`editor-dsl.ts`), client preview, polling loop, and FFmpeg server pipeline remain unchanged.

### 4. Editorial vocabulary — `src/components/desk/`

To avoid collision with `src/components/dashboard/editor/` (Studio Phase 2 components), v3 design primitives live under `src/components/desk/`. "Desk" matches "Editor's Desk" semantically.

| Name | Forbidden alternative | Notes |
|---|---|---|
| **Plate**       | ~~Card~~             | 1px ink border, radius 0, paper-100 fill. No hover-lift. Selection = 3px vermilion bar on left edge. |
| **Mark**        | —                    | Editorial glyph set: `¶ § ⁋ ▸ • — –`. Exhaustive. No emoji elsewhere. |
| **ShortcutBadge** | —                  | mono 11/12px uppercase tracking-0.04em, embedded in Button right edge / Modal close / CommandBar rows. |
| **Masthead**    | ~~Header~~ / ~~PageTitle~~ | display-lg Fraunces + full-width rule underneath. |
| **TOC**         | ~~Sidebar~~          | Fixed 240px, paper-100. Roman numerals + small caps labels. Active = vermilion `•` bullet. Collapse via `Cmd+\`. IA locked in [`docs/design/v3-creative/toc-ia-mapping.md`](../design/v3-creative/toc-ia-mapping.md): I. Studio / II. Scripts / III. Library / IV. House / V. Settings. |
| **CommandBar**  | ~~CommandPalette~~   | `Cmd+K` full-width bottom sheet (not a centered modal). Reverse-numbered mono result list (most relevant nearest the input). |
| **ColumnTimeline** | ~~Timeline~~ / ~~Filmstrip~~ | §3. Sub-components: `Column`, `Playhead`, `Rule`. |
| **FramePicker** | ~~KeyframePicker~~   | Two stacked Plates labelled `FIRST ——` / `—— LAST` (uppercase mono); middle holds a single em dash. |

Primitive shells (Button / Input / Textarea / Modal / Select / Badge / Toaster) stay under `src/components/ui/` and are rewritten in-place during S1.

### 5. Keyboard-first navigation (Linear DNA)

- `Cmd+K` — CommandBar.
- `g→s` — Scripts (Library).
- `g→t` — Timeline (ColumnTimeline for the active episode).
- `g→p` — Publish (PublishScheduler).
- `Cmd+\` — Collapse / expand TOC.
- Every clickable element exposes its shortcut in mono. No hidden shortcuts.
- `@react-aria/focus` for focus scope + roving tabindex.

### 6. Motion scope (exactly five micro-interactions)

Framer Motion is restricted to these five, enforced by ESLint `no-restricted-imports`:

1. **Scene Number Set** — left→right with 40ms stagger. No bounce.
2. **Rule Draw** — every 1px horizontal rule draws left→right via `clip-path` inset, 240ms `--ease-editorial`, once per mount.
3. **Playhead Scrub** — instant thumbnail update. `▸` glyph rotates 0→90° when playback starts.
4. **Publish Confirm** — CTA label morphs in place: `Publish` → `Publishing 01/03...` → `Published Cmd+↵`.
5. **Command Bar Summon** — `Cmd+K` slides up from bottom (160ms).

Allowed import paths (ESLint allowlist): `src/components/desk/**`, `src/components/marketing/publish-confirm.{ts,tsx}`, `src/hooks/use-reduced-motion.{ts,tsx}`. Everything else is CSS transitions at 80/160ms.

### 7. Dependencies (new)

```
framer-motion           scoped to the 5 interactions in §6
cmdk                    CommandBar
@radix-ui/react-dialog  Modal (headless)
@radix-ui/react-popover Tooltip / Popover
@radix-ui/react-tooltip Tooltip
@react-aria/focus       focus scope + roving tabindex
```

Reused: `@radix-ui/react-dropdown-menu`, `@radix-ui/react-select`, `next-themes`, `sonner` (requires restyle).

### 8. Dark theme — Phase 2 (non-blocking)

Launch MVP is light-only. The dark palette (`[data-theme="dark"]` with token swaps) exists in tokens.css but is disabled at the toggle until S7. This contains scope for the first ship and avoids double-QA during the most visually-sensitive window.

### 9. Legacy retirement

The following files move to `memory-bank/archive/design-v2/` as part of S0, with a forwarding `README.md`:

- `docs/design/VISUAL_LANGUAGE_V2.md`
- `docs/design/DASHBOARD_UX_PRINCIPLES.md`
- `docs/design/PLAN_VISUAL_LANGUAGE_V2_ROLLOUT.md`
- `docs/design/DESIGN_UX_AUDIT_REPORT.md`
- `docs/design/INTERACTIVE_AFFORDANCES.md`
- `docs/design/audit-screenshots/`
- `memory-bank/creative-apple-tier-visual-system.md`

Deleted (superseded, not archived) in S0:

- `src/app/film-strip.css`
- `src/lib/design-system-classes.ts` (S0 stubs to empty string for the bridge; S1 deletes after migrating 3 callers)

Marketing orange (`--marketing-accent`) is removed from tokens — vermilion is the only chromatic color. `.elevate-marketing-chrome` shell becomes a no-op in S0; differentiation between marketing and app is now purely structural (presence of TOC vs. Masthead-only).

## Consequences

### Positive

- **Distinctive surface.** Few AI content tools commit to editorial typography; this is market differentiation a screenshot alone communicates.
- **Reduced decoration debt.** Banning shadows and gradients at the Tailwind config level (S6 lock) means regression can't silently reintroduce them.
- **Keyboard-first is a forcing function.** Showing every shortcut in-button surfaces IA problems that hover-only tooltips would hide.
- **No schema / server-action change.** Purely presentational; no migrations.
- **Studio Phase 2 protected.** Reskin happens in chrome only; DSL v3, worker, FFmpeg builders untouched.

### Negative / risks

- **Initial build disruption.** ~90 files use `rounded-*`, ~43 use `shadow-*`. Mitigated by a v2-token shim in S0 that keeps utility names compiling (values collapse to v3) and grep gates per slice.
- **Font payload.** Fraunces variable + JetBrains Mono add two new families. Mitigated by `display=swap`, `preconnect`, and preloading only the display-lg weight (Fraunces 400 / 48).
- **CJK locales.** Fraunces is Latin-only. Per-locale fallback stacks specified; CREATIVE will validate visual parity in a typography-matrix screenshot set (S5).
- **PostCSS unicode trap.** PostCSS 8.4.31 + Turbopack chokes on em-dash in CSS comments (Unknown word). All comments in `tokens.css` and `globals.css` MUST be ASCII. (This was a real failure on the 04-24 attempt.)
- **Marketing orange may have stakeholder weight.** Q2 locks vermilion-only; the change should be communicated in CHANGELOG and possibly a blog post.

### Alternatives considered (and rejected)

| Alternative | Why rejected |
|---|---|
| Keep v2 blue primary, add typography polish only | Preserves the generic-SaaS first impression. |
| Dual-shell (marketing orange + dashboard vermilion) | Violates "one mood, one chromatic". |
| Rounded corners retained for inputs/buttons only | Mixed radius reads as half-committed. The 2px on inputs/buttons is the deliberate concession for affordance. |
| Full Framer Motion adoption | Diffuses "motion is invisible". Scoped to 5 is the Linear/Arc precedent. |
| Dark theme at launch | Doubles QA surface during the highest-risk migration window. |
| Plate primitives at `src/components/editor/` | Collides with Studio Phase 2's `src/components/dashboard/editor/` vocabulary. `src/components/desk/` chosen instead. |

## Compliance gates (all PRs against this ADR)

- [ ] `rg "rounded-(md|lg|xl|2xl|3xl)" src` — 0 matches at S6 lock.
- [ ] `rg "shadow-(sm|md|lg|xl|2xl|inner|card|ambient)" src` — 0 matches at S6 lock.
- [ ] `rg "bg-gradient-|from-[a-z]+-[0-9]|via-|to-[a-z]+-[0-9]" src` — 0 matches at S5 sweep.
- [ ] `rg "from \"framer-motion\"" src/components/{ui,dashboard,marketing,layout,blog,admin,auth}` — 0 matches (allowlist enforces).
- [ ] Every clickable element displays its keyboard shortcut in mono.
- [ ] No emoji in UI — only `¶ § ⁋ ▸ • — –`.
- [ ] Component names follow editorial vocabulary (Plate / Masthead / TOC / Rule / Mark) under `src/components/desk/`.
- [ ] ColumnTimeline visually stress-tested with 24 scenes before S4 opens.

## Next steps

1. **TOC IA CREATIVE** — see [`docs/design/v3-creative/toc-ia-mapping.md`](../design/v3-creative/toc-ia-mapping.md).
2. **PLAN S0–S2** — see [`docs/features/PLAN-editors-desk-s0-s1-s2.md`](../features/PLAN-editors-desk-s0-s1-s2.md).
3. **BUILD S0** — Tokens + Fonts + Archive + ESLint guard. Single commit on `feat/editors-desk-v3`.
4. **BUILD S1** — Primitives. Plate, Mark, ShortcutBadge in `desk/`; ten `ui/*` rewrites; final delete of `design-system-classes.ts`.
5. **BUILD S2** — Shell. TOC, Masthead, CommandBar; retire `dashboard/sidebar.tsx`.
6. **BUILD S3** — ColumnTimeline (signature). Stress-test with 24 scenes.
7. **BUILD S4–S6** — Scene/Publish + Studio Phase 2 sweep, Marketing+Auth, Admin+Billing+lock.
8. **BUILD S7** — Dark theme toggle (optional).
