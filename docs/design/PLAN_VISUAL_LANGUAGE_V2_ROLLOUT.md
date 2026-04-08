# PLAN — `VISUAL_LANGUAGE_V2.md` §9 PR rollout

**Source of truth:** [`VISUAL_LANGUAGE_V2.md`](VISUAL_LANGUAGE_V2.md)  
**Goal:** Ship Apple-tier visual discipline in **mergeable PRs** — each PR is reviewable, revertible, and passes `pnpm verify`.

**Merge order:** PR-1 → PR-2 → … — do **not** skip order (later PRs may assume tokens/classes exist).

---

## PR-1 — Tokens: radius-xl + theme bridge

| Field | Content |
|-------|---------|
| **Scope** | Add `--elevate-radius-xl: 0.75rem` (12px) in `:root` and `.dark` in `src/app/globals.css`. Expose in `@theme inline` as `--radius-xl: var(--elevate-radius-xl)` (or Tailwind v4 equivalent so `rounded-xl` maps to this token). Optionally document single `elevate-shadow-card` definition (no visual change if only comment). |
| **Files** | `src/app/globals.css` (primary); grep `rounded-xl` usage after to ensure no conflict. |
| **Acceptance** | `pnpm verify` green; `rounded-xl` in app resolves to 12px semantic card radius per V2 §4. |
| **Risk** | Low — additive tokens only. |
| **Rollback** | Revert one file. |

---

## PR-2 — Primitives: Button, Input, Textarea, Card, field-select

| Field | Content |
|-------|---------|
| **Scope** | **Radius + focus parity** per V2 §4 / §8: non-marketing `Button` uses at least `rounded-lg` (add explicit `rounded-lg` if missing); `Input` / shared `Textarea` stay `rounded-lg`; **`Card`** default moves from `rounded-lg` → **`rounded-xl`** (token-aligned). `field-select` and any `select.tsx` wrappers: `rounded-lg` minimum for trigger surface. |
| **Files** | `src/components/ui/button.tsx`, `input.tsx`, `textarea` if present, `card.tsx`, `src/components/ui/field-select.tsx`, `src/components/ui/select.tsx` if exists. |
| **Acceptance** | No primitive uses `rounded-sm` for default chrome; `pnpm verify`; spot-check Storybook N/A — use dashboard overview + login in dev. |
| **Depends on** | PR-1 (Card uses `rounded-xl` — needs token; acceptable to ship PR-2 same PR as PR-1 if team prefers **single “foundation” PR** merging tokens + Card). |
| **Risk** | Medium visual diff on cards app-wide — expected. |

**Note:** If the team wants **fewer PRs**, **merge PR-1 + PR-2** into one **“foundation: tokens + primitives”** PR.

---

## PR-3 — App shell: Sidebar active → pill inset

| Field | Content |
|-------|---------|
| **Scope** | V2 §2.2: replace full-bleed saturated active nav (if present) with **inset pill**: `rounded-md` or `rounded-lg`, `bg-highlight` or `bg-layer-02`, keep text/icon `--interactive` or `--text-primary` per design. Touch only `Sidebar` nav links + org section. |
| **Files** | `src/components/dashboard/sidebar.tsx` (primary); scan for duplicate nav patterns. |
| **Acceptance** | Light + dark: active state readable; keyboard focus visible; `pnpm verify`. |
| **Depends on** | PR-2 recommended (consistent radii). |
| **Risk** | Low–medium — UX change; screenshot before/after in PR description. |

---

## PR-4 — Marketing: KPI preview + Pretext hero accent discipline

| Field | Content |
|-------|---------|
| **Scope** | V2 §2.1: **Hero KPI / sparklines** = product preview — **neutral strokes + single blue series** OR monochrome; optional micro-label “Product UI preview” (i18n key). Files: `src/components/marketing/kpi-dashboard-preview.tsx` (Sparkline colors), `PretextHeroStatement` / home sections in `src/app/[locale]/(marketing)/page.tsx` if secondary headline competes with orange — ensure **one accent story** in hero band. |
| **Files** | `kpi-dashboard-preview.tsx`, `pretext-hero-statement.tsx` (if needed), `messages/*.json` for one label string. |
| **Acceptance** | Marketing home: no third hot color in KPI strip; `pnpm verify`; visual check `/` and `/en`. |
| **Depends on** | None hard; can parallel PR-3 if different authors (watch merge conflicts on `messages`). |
| **Risk** | Medium — brand perception; keep copy changes minimal. |

---

## PR-5 — Sweep: auth, admin, studio, leftover `rounded-sm`

| Field | Content |
|-------|---------|
| **Scope** | V2 §9 step 5: grep `rounded-sm` in `src/app/(auth)`, `src/app/admin`, `src/components/auth`, dashboard studio/productions forms, MDX components — migrate to `rounded-md` / `rounded-lg` per role (tabs vs fields). **Do not** change `variant="marketing"` pill buttons. |
| **Files** | Outcome of `rg 'rounded-sm' src/` — batch by directory in sub-commits if large. |
| **Acceptance** | `pnpm verify`; ESLint optional follow-up (`no-restricted-syntax` for `rounded-sm` with allowlist). |
| **Depends on** | PR-2 helps consistency. |
| **Risk** | Low — mostly mechanical; watch dense admin tables. |

---

## PR-6 — QA gate + doc touch

| Field | Content |
|-------|---------|
| **Scope** | Run full checklist: light/dark marketing + dashboard; keyboard Tab through login + sidebar; `pnpm verify`. Update [`DESIGN_UX_AUDIT_REPORT.md`](DESIGN_UX_AUDIT_REPORT.md) or short **“V2 shipped”** note in [`VISUAL_LANGUAGE_V2.md`](VISUAL_LANGUAGE_V2.md) footer (date + PR links). Optional: refresh `docs/design/audit-screenshots/` from staging/prod. |
| **Files** | Docs only + optional screenshots. |
| **Acceptance** | Checklist completed in PR description; no open V2 §9 items. |
| **Depends on** | PR-1–5 merged. |
| **Risk** | None. |

---

## Optional consolidations

| Option | When |
|--------|------|
| **PR-1+2 single PR** | Small team — faster, one “foundation” review. |
| **PR-4 split** | KPI-only PR first; Pretext copy/hierarchy second if copy review is slow. |
| **PR-5 split** | `auth/` only vs `dashboard/` only if diff is huge. |

---

## Execution checklist (assignee)

- [x] PR-1 merged  
- [x] PR-2 merged  
- [x] PR-3 merged  
- [x] PR-4 merged  
- [x] PR-5 merged  
- [x] PR-6 merged (doc touch + verify; optional: audit screenshots / `DESIGN_UX_AUDIT_REPORT` refresh)  
- [x] `memory-bank/tasks.md` P1 row marked done  

---

## References

- CREATIVE lock: [`memory-bank/creative-apple-tier-visual-system.md`](../../memory-bank/creative-apple-tier-visual-system.md)  
- Layer model: [`SYSTEM.md`](SYSTEM.md)
