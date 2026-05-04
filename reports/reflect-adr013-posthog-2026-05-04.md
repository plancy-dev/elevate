# REFLECT — ADR-013 PostHog production gate (2026-05-04)

**Context:** BUILD merged Phase 1b wiring; ADR-013 §5 **success definition** requires non-zero `ELEVATE_MARKETING_CTA_CLICK` (`elevate_marketing_cta_click`) by `cta_id` in 7d (14 values).

**Check (PostHog MCP, project 358775 — Elevate):**

```sql
SELECT count() AS total
FROM events
WHERE event = 'elevate_marketing_cta_click'
  AND timestamp >= now() - INTERVAL 8 DAY;
```

**Result:** `total = 0` (MCP `query-run` HogQL, 2026-05-04).

**Interpretation (non-exhaustive):**

- Production may not yet send to this PostHog project, or keys/host mismatch, or **no user clicks** since deploy in this window.
- Distinct-event search (`event ILIKE '%cta%' OR '%elevate%'`, 30d) returned no rows in the MCP response shape — treat as **no corroborating custom events** in the sampled window until re-run in UI.

**ADR-013 REFLECT exit gate:** **not satisfied** (cannot assert 14× `cta_id` non-zero).

**Next actions:**

1. In PostHog UI (same project), open Insights → run the HogQL above (or Trends on `elevate_marketing_cta_click` + breakdown `cta_id`).
2. Confirm **prod** `NEXT_PUBLIC_POSTHOG_KEY` (or equivalent) targets **project 358775**.
3. After traffic appears, re-run MCP or export screenshot; then update `memory-bank/tasks.md` STAB line + ADR-013 checklist.

**No code change required** for this REFLECT slice unless prod is pointed at the wrong project.
