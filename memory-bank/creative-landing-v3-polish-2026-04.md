# Creative Decision: Landing V3 Polish (Core Marketing)

## Context

- Scope locked from INIT/PLAN:
  - landing home (`/[locale]`)
  - core marketing pages: `pricing`, `product`, `solutions`, `blog` list
- Direction locked by user:
  - editorial-subtle motion
  - readability first
  - “designed by senior designer” quality bar

Primary targets:

- [`src/components/marketing/kpi-dashboard-preview.tsx`](../src/components/marketing/kpi-dashboard-preview.tsx)
- [`src/app/[locale]/(marketing)/page.tsx`](../src/app/%5Blocale%5D/(marketing)/page.tsx)
- [`src/components/marketing/waitlist-form.tsx`](../src/components/marketing/waitlist-form.tsx)
- [`src/app/[locale]/(marketing)/pricing/page.tsx`](../src/app/%5Blocale%5D/(marketing)/pricing/page.tsx)
- [`src/app/[locale]/(marketing)/product/page.tsx`](../src/app/%5Blocale%5D/(marketing)/product/page.tsx)
- [`src/app/[locale]/(marketing)/solutions/page.tsx`](../src/app/%5Blocale%5D/(marketing)/solutions/page.tsx)
- [`src/app/[locale]/(marketing)/blog/page.tsx`](../src/app/%5Blocale%5D/(marketing)/blog/page.tsx)
- [`src/app/globals.css`](../src/app/globals.css)

---

## Creative North Star

The page should read like a premium editorial spread, not a dashboard collage.

- One dominant narrative per section.
- Fewer visual edges, stronger typographic hierarchy.
- Motion should confirm structure, not distract from content.
- Dark mode must preserve intent and contrast, not invert into a different aesthetic.

---

## Visual System Decisions

## 1) KPI Preview: “Calm Instrument Panel”

Problem:
- Current block feels noisy due to stacked borders, mixed text scales, and equal visual weight across all cells.

Decision:
- Convert to a 3-layer rhythm:
  1. header rail
  2. metric strip
  3. recent activity list
- Remove redundant nested borders and rely on section separators only.
- Typography compression:
  - labels: mono micro
  - values: one emphasized size
  - metadata: single subdued body size
- Sparkline remains, but secondary to value (reduced stroke prominence/visual pull).

Acceptance:
- At first glance users can identify: “what this panel is”, “current status”, “recent activity” in under 2 seconds.

## 2) Waitlist Band: “Guaranteed Contrast in Dark”

Problem:
- In dark mode, band/background semantics and forced white text can collapse readability.

Decision:
- Stop hard-coding white-based panel semantics for all states.
- For `variant="panel"` in waitlist form:
  - use token-driven contrast values for text/input/placeholder/error/success.
  - keep CTA prominence without over-bright contrast spikes.
- Band must maintain readable hierarchy:
  - title > supporting copy > form hint > actions.

Acceptance:
- WCAG-oriented contrast sanity:
  - title/supporting copy clearly readable in both themes.
  - input placeholder and hint are readable but subordinate.
  - success/error states remain legible on first glance.

## 3) Core Marketing Pages: “One Hierarchy Language”

Problem:
- Card/table/list pages each use slightly different density and emphasis rules.

Decision:
- Normalize hierarchy primitives across `pricing/product/solutions/blog`:
  - heading scale and spacing rhythm aligned to home.
  - card/list row paddings standardized.
  - metadata tone uses one subdued tier (`ink-500`) consistently.
  - CTA tone and hover behavior use same accent rule.

Acceptance:
- Jumping between these pages feels like one product family, not multiple templates.

---

## Interaction Decisions (Editorial-Subtle)

Constraints:
- No Framer Motion expansion for marketing scope.
- CSS-only motion, using existing tokens:
  - `--ease-editorial`
  - `--dur-instant`, `--dur-quick`, `--dur-page`

Decision:
- Allowed interaction set:
  - hover/focus color and surface shifts
  - minimal reveal on section/card entry where meaningful
  - micro feedback on form success/error transitions
- Disallowed:
  - large transforms
  - spring/bouncy effects
  - timeline-like dramatic choreography

`prefers-reduced-motion` policy:
- reduce reveal to opacity-only or disable non-essential transitions.
- keep information flow identical without motion.

Acceptance:
- Motion is noticed as polish, never as feature.
- Keyboard and reduced-motion users lose no information.

---

## Craft Rules (Implementation Guardrails)

- Favor subtraction over decoration.
- If two elements compete, demote one via tone/weight, not extra color.
- Keep accent (`vermilion`) intentional:
  - action or semantic emphasis only
  - never continuous background noise
- Do not introduce new radius/shadow language that breaks v3 identity.

---

## QA Rubric for “Senior Quality”

## Readability
- Can a new user identify primary action in each section immediately?
- Is there any block where eye-scanning gets trapped by too many equal-contrast elements?

## Aesthetic Coherence
- Do all core marketing pages share one typographic and spacing grammar?
- Does dark mode feel like the same brand voice?

## Interaction Quality
- Any motion that draws attention away from copy is removed.
- Focus states are visible and elegant.
- Reduced-motion mode remains fully comprehensible.

## Technical Confidence
- No regression in existing E2E/unit contracts.
- No runtime visual break at common breakpoints.

---

## Decision

Proceed with implementation under this creative contract.
Any deviation should be justified by readability/accessibility evidence, not taste preference alone.

