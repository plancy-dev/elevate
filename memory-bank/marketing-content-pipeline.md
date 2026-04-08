# Marketing & content pipeline — blog ↔ ebook ↔ PLG (Elevate)

**Purpose:** Long-term alignment for **multilingual blog** (acquisition + engagement) and **ebook SKUs** (same themes, paid layer), without blocking Prompt Studio engineering.  
**North Star:** [`creative-elevate-ai-pivot.md`](creative-elevate-ai-pivot.md). **Analytics contract:** [`docs/CONTENT_FUNNEL.md`](../docs/CONTENT_FUNNEL.md).

---

## Goals (what “good” looks like)

1. **Traffic:** localized blog posts rank and get qualified visits (SEO + referrals).
2. **Engagement:** time-on-site and scroll depth where measured; repeat visits optional (newsletter / waitlist).
3. **Action:** `#waitlist` / `elevate_waitlist_submitted`; later Prompt Studio beta via DB allowlist + `STUDIO_BETA_REQUIRE_ALLOWLIST`.
4. **Reuse:** each **pillar topic** can spawn **blog fragments** first, then **ebook chapters/SKUs** in chunks (not one big drop).

**Non-goals for this doc:** MICE features; replacing `pnpm verify` or repo rules.

---

## gstack — suggested roles & pipelines

| Phase | gstack (optional) | In-repo anchor |
|-------|-------------------|----------------|
| **Positioning & calendar** | `/office-hours` → `/plan-ceo-review` | `tasks.md` “Now”, this file Phase M1 |
| **Editorial + IA** | `/plan-design-review` (content hierarchy, CTAs) | `CONTENT_FUNNEL.md`, blog MDX |
| **Launch quality** | `/review` (PR), `/qa` or `/browse` (flows) | PostHog funnels |
| **Retro** | `/retro` (weekly) | what shipped vs metrics |

Use **`docs/AI_ORCHESTRATION.md`** — Memory Bank holds **what** we ship; gstack holds **how we review**.

---

## Phases (blog → ebook, split delivery)

### Phase M1 — Instrumentation & governance (done / ongoing)

- PostHog: `elevate_blog_post_viewed` (`slug`, `locale`, `post_title`); existing CTA + waitlist + funnel events.
- Prompt Studio beta: `prompt_studio_beta_allowlist` + `/admin/prompt-studio-allowlist`; env `STUDIO_BETA_REQUIRE_ALLOWLIST`.

### Phase M2 — Content pillars (quarterly) — ✅ planning doc

- **Delivered:** [`marketing-pillars-m2.md`](marketing-pillars-m2.md) — five pillars, locale priority, editorial rhythm, quarterly calendar template, gstack hooks.

### Phase M3 — Blog fragments (parallel per pillar)

- Ship **short posts** (problem → insight → CTA to waitlist / product).
- Same pillar → later **cluster** internal links.

### Phase M4 — Ebook slices (per SKU)

- Map **pillar → ebook outline** (`content_products`, `content/ebooks/<slug>/`).
- **Slice = one purchasable unit** (chapter pack, guide, or single ebook) — implement **SKUs incrementally** (catalog row + entitlements + reader as today).

### Phase M5 — Measurement loop

- **Funnel recipes (repo):** [`docs/POSTHOG_FUNNELS.md`](../docs/POSTHOG_FUNNELS.md) — Funnels A–D, dashboard layout, troubleshooting.
- **PostHog UI:** create saved insights/dashboards in your project (still manual; `tasks.md` P1).

---

## Operational checklist

- [x] Apply migration `016` on Supabase (operator); run `pnpm db:types` when project is linked.
- [ ] Set `STUDIO_BETA_REQUIRE_ALLOWLIST` only when ready to **gate** studio (otherwise false for open placeholder).
- [ ] Keep **waitlist** (marketing) and **studio beta allowlist** (product gate) conceptually separate in comms.
- [ ] PostHog: create dashboards using [`docs/POSTHOG_FUNNELS.md`](../docs/POSTHOG_FUNNELS.md).

---

## Related

- [`docs/POSTHOG_FUNNELS.md`](../docs/POSTHOG_FUNNELS.md)
- [`docs/CONTENT_FUNNEL.md`](../docs/CONTENT_FUNNEL.md)
- [`docs/adr/ADR-002-prompt-studio-mvp.md`](../docs/adr/ADR-002-prompt-studio-mvp.md)
- [`reflect-ebook-content-funnel.md`](reflect-ebook-content-funnel.md)
