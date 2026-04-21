# Elevate Design System

**Elevate** is an AI adoption & workflow platform for teams. It turns measurable AI outcomes into repeatable workflows — premium ebooks/guides, templates, and (roadmap) agent workspaces — sold as organization-scoped subscriptions.

---

## Product Context

### Surfaces

| Surface | Route Group | Description |
|---------|-------------|-------------|
| **Marketing site** | `app/[locale]/(marketing)/` | Warm cream canvas, editorial long-form; orange CTA accent (`--marketing-accent`); global `elevate-marketing-chrome` class |
| **Dashboard app** | `app/(dashboard)/dashboard/` | IBM Carbon–inspired blue primary; calm neutrals; list-heavy (Library, Studio, Productions) |
| **Admin console** | `app/(dashboard)/dashboard/admin/` | Entitlements, billing, content catalog; same shell as dashboard |
| **Auth flows** | `app/(auth)/` | Login, signup, forgot-password, access-pending; neutral + split-panel layout |

### Tech Stack
- **Next.js 16** (App Router, RSC) · **TypeScript strict** · **Tailwind CSS v4** with semantic tokens
- **Supabase** (Postgres + Auth + RLS + Storage) · **Vercel** · **Toss Payments** · **PostHog**
- **next-intl** (ko/en)

### Sources Provided
- `design/` — local mount: design docs, VISUAL_LANGUAGE_V2.md, SYSTEM.md, DASHBOARD_UX_PRINCIPLES.md, INTERACTIVE_AFFORDANCES.md, Cal & Cursor alignment docs
- `ui/` — local mount: core UI component source (button, card, input, badge, modal, select, textarea)
- `app/` — local mount: Next.js app directory (globals.css + key pages)
- `github:plancy-dev/elevate@main` — full source repo; key paths: `src/components/layout/`, `public/brand/`, `src/app/globals.css`

---

## CONTENT FUNDAMENTALS

### Voice & Tone
- **Pragmatic, evidence-first, slightly editorial.** Short sentences. No hype.
- Measurable outcomes over marketing fluff: "Turn AI outcomes into repeatable workflows" not "Unleash the power of AI."
- **Korean-first** with English parity via next-intl. Copy keys in `messages/`.
- B2B professional but not stuffy. Direct. Assumes technical literacy.
- **No emoji** in UI or copy. Never in headings, buttons, or badges.

### Casing
- **Headings:** Sentence case (not Title Case) — e.g. "Prompt Studio" (product name), "Join the waitlist" (CTA).
- **Uppercase labels:** Used for section markers inside app shell — `text-[11px] font-semibold uppercase tracking-wider text-text-tertiary`. Never orange.
- **Buttons:** Sentence case.
- **Badges:** Short, 1–2 words, sentence case. E.g. "Beta", "Ebook", "Included".

### Writing Patterns
- Section headlines are tight: `tracking-[-0.02em]`, `font-semibold`.
- Supporting copy max ~65ch. Leads with concrete benefit.
- CTAs are action verbs: "Join waitlist", "Open Prompt Studio", "Get started".
- Hint text under CTAs: softens commitment — "No credit card required."
- Auth pages: reassuring, minimal. "Sign in to access purchases, downloads, and organization tools—not a mandatory product tour."

### Examples (real copy from codebase)
- Hero headline: "AI adoption & workflow platform / for teams." (two-color split)
- KPI badge: "PROMPT STUDIO" (uppercase label over headline)
- Library empty state: keeps it plain, no filler decoration.
- Footer tagline: short trust statement.

---

## VISUAL FOUNDATIONS

### Colors

Two strict surface modes share one token system (`app/globals.css`).

**App shell (dashboard/admin/auth):**
- Background: `#fafafa` (light) / `#0d0d0d` (dark)
- Layer stack: `--layer-01` (white) → `--layer-02` (#f4f4f4) → `--layer-03` (#e8e8e8)
- Primary action: IBM Blue `--primary: #0f62fe` / hover `#0353e9` / active `#002d9c`
- Interactive links: `--interactive: #0f62fe` (light) / `#4589ff` (dark)
- Accent (success): `--accent: #198038` (light) / `#42be65` (dark)
- Danger: `--danger: #da1e28`
- Borders: `--border: #c6c6c6` / `--border-subtle: #e0e0e0`
- Text stack: `--text-primary: #161616` → `--text-secondary: #393939` → `--text-tertiary: #6f6f6f`

**Marketing chrome (`.elevate-marketing-chrome`):**
- Canvas: `--marketing-canvas: #f2f1ed` (Cursor-inspired warm cream)
- Ink: `--marketing-ink: #26251e` → `--marketing-ink-secondary: #3f3e38` → `--marketing-ink-tertiary: #6f6d63`
- CTA accent: `--marketing-accent: #f54e00` (Cursor Orange) / hover `#e04400`
- Glow: `rgba(245, 78, 0, 0.12)` — radial gradient used in hero only
- Border: `--marketing-border-subtle: rgba(38, 37, 30, 0.1)`
- `--primary` stays IBM blue in marketing (charts, logos, interactive) — orange is CTA only

### Typography

- **Font family:** Geist Sans (`--font-geist-sans`) + Geist Mono (`--font-geist-mono`) — loaded via `next/font/local`
- No custom display font (v2 scope: requires legal sign-off before adding)
- CJK fallback fonts loaded per locale: `app/[locale]/fonts/ko.ts`, `ja.ts`, `zh-CN.ts`, `zh-TW.ts`
- **Fluid type scale** for marketing (CSS `clamp()`):
  - Home hero: `clamp(2rem, 1.2rem + 3.2vw, 3.5rem)` — `--elevate-marketing-home-hero-size`
  - Section title: `clamp(1.375rem, 1.12rem + 1.05vw, 1.875rem)`
  - Lead/body: `clamp(1rem, 0.94rem + 0.22vw, 1.125rem)`
  - Prose body: `clamp(0.9375rem, 0.875rem + 0.2vw, 1.0625rem)` with `line-height: 1.65`
- **App shell type:**
  - Page title: `text-2xl font-semibold tracking-tight` (24px)
  - Top bar label: `text-sm font-medium` (14px)
  - Uppercase section label: `text-[11px] font-semibold uppercase tracking-wider text-text-tertiary`
  - Body: `text-sm` (14px), secondary copy `text-xs` (12px)
- Tracking: headings use `tracking-[-0.02em]` throughout; body tracking normal

### Backgrounds & Surfaces
- **Marketing:** flat warm cream `#f2f1ed` canvas; no gradients except single orange radial glow in hero (`top-right`, 58% fade). `bg-layer-01` (`white`) for alternating sections.
- **App:** `--background: #fafafa`; cards use `bg-layer-01` with `border border-border-subtle` + `shadow-card`. Dense tables use border-only (no shadow). Never competing shadows.
- No full-bleed imagery in UI chrome. OG image exists (`public/og-default.webp`) for social sharing.
- No illustration system (explicitly out of v2 scope). No hand-drawn patterns.

### Radius System (semantic)
| Token | Value | Use |
|-------|-------|-----|
| `--elevate-radius-sm` | 4px | Legacy chips only; deprecating |
| `--elevate-radius-md` | 8px | Tabs, segmented controls, small dense buttons |
| `--elevate-radius-lg` | 10px | **Default** inputs, buttons (non-pill) |
| `--elevate-radius-xl` | 12px | Cards, dialogs, large panels |
| `--elevate-radius-pill` | 9999px | Marketing CTA buttons **only** |

Rules: App `Button` = `rounded-lg`. Marketing CTA = `rounded-full`. Cards = `rounded-xl`. Never `rounded-sm` on new UI.

### Shadow System
- `shadow-ambient`: `0 0 16px rgba(0,0,0,0.02), 0 0 8px rgba(0,0,0,0.008)` — subtle lift, subscription banners, ambient panels
- `shadow-card` (light): Cal-influenced 3-layer — contact + ring + diffuse: `0 1px 5px -4px rgba(19,19,22,0.12), 0 0 0 1px rgba(34,42,53,0.06), 0 4px 14px rgba(34,42,53,0.06)`
- `shadow-card` (dark): `0 0 0 1px rgba(255,255,255,0.06), 0 1px 4px -2px rgba(0,0,0,0.45), 0 18px 40px rgba(0,0,0,0.35)`
- **Depth budget = 2:** page background + elevated card. Modal/dropdown adds optional third level only.

### Cards
- `rounded-xl border border-border-subtle bg-layer-01 shadow-card`
- Dense tables: `rounded-xl` container + `divide-y divide-border-subtle` rows + hover on row only (no individual row shadows)
- Card-in-card: use `bg-layer-02` background step — no nested border rings

### Motion & Animation
- Default hover: 100ms color/bg transition
- Panel expand / modal: 160ms `ease-out`
- Route transitions: 0ms (none in v2)
- Named keyframes: `fade-up` (0.5s), `slide-in-right` (0.4s), `count-up` (0.6s), `pulse-subtle` (2s)
- Stagger utilities: `.stagger-1` through `.stagger-4` (0.1–0.4s delay)
- Marketing hero: `elevate-pretext-hero-fade-up` (0.75s ease-out)
- Always: `@media (prefers-reduced-motion: reduce)` — disable layout-moving keyframes

### Hover & Press States
- **Nav/list rows:** `hover:bg-layer-02` (100–150ms transition)
- **Buttons:** variant-specific hover colors (lighter for primary: `#0353e9`)
- **Links:** `text-interactive` with `hover:text-primary` (app) or `hover:text-marketing-accent-hover` (marketing)
- **Cards (hoverable):** `hover:bg-layer-02 hover:border-border`
- **Press/active:** primary button `active:bg-primary-active` (`#002d9c`)

### Borders
- Hairlines: `border-border-subtle` — default dividers, card outlines
- Darker: `border-border` (`#c6c6c6`) — hover state, more prominent
- Marketing: `border-marketing-border-subtle` (`rgba(38,37,30,0.1)`) — warm-tinted
- Subscription/empty state: `border-dashed border-border-subtle` — de-emphasized notice
- No double borders (card-in-card uses bg step, not second ring)

### Blur & Transparency
- Header: `bg-marketing-canvas/90 backdrop-blur-md` (sticky nav frosted glass)
- Modal overlay: `bg-layer-01/75 backdrop-blur-[0.5px]` (nav pending spinner)
- Scrollbar: 4px width, `border-radius: 2px`, transparent track

### Imagery
- No color treatment defined (no grain, no B&W filter)
- Product screenshots / KPI preview: "Product UI preview" label; monochrome + single blue series; no orange in charts
- OG image is warm-toned (matches marketing canvas aesthetic)

### Iconography
→ See ICONOGRAPHY section below

---

## ICONOGRAPHY

**Icon library:** [Lucide React](https://lucide.dev) — `lucide-react` package. Stroke-weight icons, consistent 1.5px stroke, square viewBox.

**Usage in codebase:**
- All icons imported from `lucide-react` (e.g. `Sparkles`, `BookOpen`, `ArrowRight`, `Users`, `Clapperboard`, `Menu`, `X`, `ChevronDown`)
- Icon size: `h-4 w-4` (16px) standard; `h-5 w-5` (20px) feature icons; `h-3 w-3` (12px) inline link arrows
- Color: `text-text-tertiary` for decorative; `text-primary` for active/interactive; `text-interactive` for links
- `aria-hidden` on all decorative icons
- No emoji used anywhere. No unicode icon substitutes.
- No custom icon font. No SVG sprites.

**Logo system** (in `assets/`):
- `elevate-mark.svg` — square logomark (SVG), used in favicon/apple-touch
- `elevate-mark-192.png` — 192px raster mark, used in `ElevateLogo` component (circular crop, `ring-1 ring-black/10`)
- `elevate-wordmark.svg` — horizontal wordmark SVG
- `elevate-wordmark.png` — horizontal wordmark PNG fallback
- `og-default.webp` — Open Graph default image

**Logo component** (`ElevateLogo`): `size` prop (sm/md/lg → 28/32/40px). `showText` prop adds "Elevate" wordmark text in `font-semibold tracking-[-0.02em] text-text-primary`. Mark rendered as circular crop with subtle ring.

---

## FILE INDEX

```
README.md                     ← This file (full design system reference)
SKILL.md                      ← Agent skill entrypoint
colors_and_type.css           ← CSS custom properties (tokens + semantic)

assets/
  elevate-mark.svg            ← Square logomark (SVG)
  elevate-mark-192.png        ← 192px raster mark (circular in logo component)
  elevate-wordmark.svg        ← Horizontal wordmark (SVG)
  elevate-wordmark.png        ← Horizontal wordmark (PNG)
  og-default.webp             ← OG default social image

preview/                      ← Design System tab cards (registered assets)
  colors-app.html             ← App shell color palette
  colors-marketing.html       ← Marketing palette (cream + orange)
  colors-semantic.html        ← Semantic roles (text, bg, border, state)
  type-marketing.html         ← Marketing type scale
  type-app.html               ← App shell type scale
  type-specimens.html         ← Font specimens (Geist Sans + Mono)
  spacing-radius.html         ← Radius tokens
  spacing-shadows.html        ← Shadow system + elevation
  spacing-tokens.html         ← Spacing scale
  components-buttons.html     ← Button variants + states
  components-badges.html      ← Badge variants
  components-inputs.html      ← Input + form fields
  components-cards.html       ← Card patterns
  components-nav.html         ← Sidebar nav + top bar patterns
  brand-logo.html             ← Logo variants + clearspace
  brand-icons.html            ← Lucide icon reference

ui_kits/
  marketing/
    index.html                ← Interactive marketing site prototype
  dashboard/
    index.html                ← Interactive dashboard app prototype
  auth/
    index.html                ← Auth flows prototype
```
