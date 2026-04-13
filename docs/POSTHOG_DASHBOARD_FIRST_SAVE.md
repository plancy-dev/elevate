# PostHog — save the Marketing dashboard (M5)

**Purpose:** Complete **M5** (“funnel saved in PostHog UI”) in one sitting—no code deploy required.  
**Prerequisite:** `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` (`phc_…`) is set in production and you see events in **Activity** or **Live events**. If not, fix env first using [`POSTHOG_FUNNELS.md`](./POSTHOG_FUNNELS.md) § troubleshooting.

**Official docs:** [Funnels](https://posthog.com/docs/product-analytics/funnels) · [Dashboards](https://posthog.com/docs/product-analytics/dashboards).

---

## Timebox

About **15 minutes** after events are flowing.

---

## Steps (do in order)

1. **Create dashboard** (if it doesn’t exist)  
   - **Dashboards** → **New dashboard** → name: **`Elevate — Marketing`**.

2. **Funnel A — blog → waitlist**  
   - **New insight** → **Funnel**  
   - Step 1: `elevate_blog_post_viewed`  
   - Step 2: `elevate_waitlist_submitted`  
   - Conversion window: **14 days** (adjust later)  
   - **Save** → name: **`Elevate — Funnel A — blog → waitlist`**  
   - **Add to dashboard** → `Elevate — Marketing`

3. **Funnel B — hero CTA → waitlist** (minimum: one CTA)  
   - New **Funnel** → Step 1: `elevate_marketing_cta_click` with filter **`cta_id` = `hero_waitlist_anchor`** → Step 2: `elevate_waitlist_submitted`  
   - Save as **`Elevate — Funnel B — hero_waitlist_anchor → waitlist`** → add to same dashboard.

4. **Trends (weekly)**  
   - **Trends** → `elevate_blog_post_viewed` → interval **Week** → save as **`Elevate — Trend — blog_post_viewed (weekly)`** → add to dashboard.  
   - Repeat for **`elevate_waitlist_submitted`**.

5. **Pin / share**  
   - Open **`Elevate — Marketing`** → confirm all tiles load → copy dashboard URL for Slack/bookmarks.

Optional product tiles (same doc, detailed): [`POSTHOG_FUNNELS.md`](./POSTHOG_FUNNELS.md) § Funnel D, E, and insight name table.

---

## Done when

- [ ] Dashboard **`Elevate — Marketing`** exists and is not empty.  
- [ ] At least **Funnel A** + **one trend** are saved (not only drafts).  
- [ ] Team has **one** canonical link to that dashboard.

---

## Why this isn’t automated

PostHog dashboards are intentionally created in the **project UI** so filters, breakdowns, and ownership stay with the operator. The repo documents **event names** (`src/lib/analytics/posthog-events.ts`) and **recipes**—not API-created dashboards.
