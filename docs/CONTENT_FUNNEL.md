# Content funnel — Prompt Studio first (Elevate AI)

This document aligns **Elevate AI**’s first MVP (**prompt improvement / Prompt Studio**), **whitelist capture** (`#waitlist`), and **growth channels** (blog, newsletter, SEO, paid) with **catalog & e-books** as a parallel commercial layer—not the homepage headline. North Star: [`memory-bank/creative-elevate-ai-pivot.md`](../memory-bank/creative-elevate-ai-pivot.md).

## Funnel stages

| Stage | User action | Product touchpoints (current / planned) |
|-------|-------------|----------------------------------------|
| Awareness | SEO, social, referrals, ads | Localized home (`/[locale]`): **Prompt Studio** + waitlist; blog/resources for inbound |
| Interest | Learn product; join whitelist without account | `/product/prompt-studio`, `/pricing`, `/demo`, `/contact`; **`#waitlist`** → `waitlist_signups` |
| Conversion (lead) | Waitlist (Prompt Studio beta) | `POST /api/waitlist`; PostHog `elevate_waitlist_submitted` (no email in analytics) |
| Conversion (pay) | Pay | Toss (`docs/adr/ADR-001-toss-payments-poc.md`) — `?product=<slug>`; `content_product_id` on intent (`011`) |
| Access | Prompt improvement + files | **Prompt Studio** (MVP roadmap); **Library** for entitled `content_products` |
| Expand | Team, more SKUs, B2B | Invites (`006`), org billing, future upsell |

## Journey (happy path)

1. Land on marketing site → primary paths **`#waitlist`** (whitelist) and **`/product/prompt-studio`**; **catalog** (`/product/ebooks-and-guides`) is secondary growth/revenue.
2. Optional **Create account** (`/signup`) for catalog purchase and Library downloads; not framed as a full product demo.
3. **Dashboard**: **Prompt Studio** when enabled; **Library** / **Billing** (`?product=`) for catalog SKUs.
4. **Purchase**: payment confirms **organization** entitlement where wired.
5. **Library**: `product_kind` (default `ebook`), **Download** when `storage_object_path` set (`012`).

## Schema

- `content_products` — catalog row; **`product_kind`**: `ebook` | `guide` | `template` | `bundle` (migration `010`).
- `organization_content_entitlements` — org has access to a product after purchase or grant.
- `waitlist_signups` — marketing email signup (`013`); RLS: no public policies; inserts via service role from `POST /api/waitlist` only.

## Analytics (PostHog)

- **Event names** (single source: `src/lib/analytics/posthog-events.ts`): `elevate_funnel_*` (app: Library, Billing, purchase, download); `elevate_waitlist_submitted` / `elevate_waitlist_submit_failed` (properties: `source`, `locale`, optional `http_status`); `elevate_marketing_cta_click` (property `cta_id` from `MarketingCtaId`, e.g. `hero_waitlist_anchor`, `hero_prompt_studio`, `hero_ebooks`).
- **Dashboards**: create funnels in PostHog (e.g. `cta_id` → `elevate_waitlist_submitted`; pageviews are auto-captured on marketing routes).

## Known gaps (prioritized)

1. **Solo buyer** — today’s model is org-scoped; for strict B2C ebook, consider `user_id` on entitlements or a personal org.
2. **Ops** — create Storage bucket/policies; set `storage_object_path` on catalog rows; optional access logs.
3. **Analytics** — dashboards and alerts in PostHog are manual; optional server-side capture for waitlist (duplicate of client success) if you need backend-only verification.

## Related

- Reflection / audit: [`memory-bank/reflect-ebook-content-funnel.md`](../memory-bank/reflect-ebook-content-funnel.md), [`memory-bank/reflect-mvp-waitlist-landing-audit.md`](../memory-bank/reflect-mvp-waitlist-landing-audit.md)
- gstack (YC-style review loops): [`docs/GSTACK.md`](GSTACK.md)
