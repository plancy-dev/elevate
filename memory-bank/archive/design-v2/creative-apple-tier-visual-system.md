# CREATIVE — Apple-tier visual system (Elevate)

**Date:** 2026-04-08  
**Authority:** Single product design contract for “calm premium” web UI — execution detail lives in one place.

## Decision

All implementation and review MUST follow:

**[`docs/design/VISUAL_LANGUAGE_V2.md`](../docs/design/VISUAL_LANGUAGE_V2.md)**

That document locks:

- **Two-surface story:** Marketing = warm + **orange only** for primary conversion; App = **blue-only** interaction — **no orange in dashboard chrome.**
- **One accent per viewport story** — no competing hero accents.
- **Radius semantics** — pill = marketing CTA only; app controls share `md`/`lg`/`xl` scale (see table in V2).
- **Depth budget = 2** — page vs card; no shadow arms race.
- **Motion** — short, ease-out, reduced-motion safe.
- **Rollout order** — tokens → primitives → shell → marketing KPI polish → sweep.

## Relation to other North Star docs

- **Product strategy:** Still [`creative-elevate-ai-pivot.md`](creative-elevate-ai-pivot.md).
- **Visual execution:** **`VISUAL_LANGUAGE_V2.md`** supersedes ad-hoc polish notes when they conflict.

## Next step for engineering

→ **PLAN** (scope PRs per §9 rollout) → **BUILD** (tokens + components + surfaces).
