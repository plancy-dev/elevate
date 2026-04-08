# Content funnel — Prompt Studio first (Elevate AI)

This document aligns **Elevate AI**’s first MVP (**prompt improvement / Prompt Studio**), **whitelist capture** (`#waitlist`), and **growth channels** (blog, newsletter, SEO, paid) with **catalog & e-books** as a parallel commercial layer—not the homepage headline. North Star: [`memory-bank/creative-elevate-ai-pivot.md`](../memory-bank/creative-elevate-ai-pivot.md).

## Funnel stages

| Stage | User action | Product touchpoints (current / planned) |
|-------|-------------|----------------------------------------|
| Awareness | SEO, social, referrals, ads | Localized home (`/[locale]`): **Prompt Studio** + waitlist; blog/resources for inbound |
| Interest | Learn product; join whitelist without account | `/product/prompt-studio`, `/pricing`, `/demo`, `/contact`; **`#waitlist`** → `waitlist_signups` |
| Conversion (lead) | Waitlist (Prompt Studio beta) | `POST /api/waitlist`; PostHog `elevate_waitlist_submitted` (no email in analytics) |
| Conversion (pay) | Pay | Toss (`docs/adr/ADR-001-toss-payments-poc.md`) — `?product=<slug>`; `content_product_id` on intent (`011`) |
| Access | Prompt improvement + files | **Prompt Studio** (MVP roadmap); **Library** — read access = paid org plan **or** per-SKU entitlement (`013`); PDF download vs **web-only** in-app reader |
| Expand | Team, more SKUs, B2B | Invites (`006`), org billing, future upsell |

## Journey (happy path)

1. Land on marketing site → primary paths **`#waitlist`** (whitelist) and **`/product/prompt-studio`**; **catalog** (`/product/ebooks-and-guides`) is secondary growth/revenue.
2. Optional **Create account** (`/signup`) for catalog purchase and Library downloads; not framed as a full product demo.
3. **Dashboard**: **Prompt Studio** when enabled; **Library** / **Billing** (`?product=`) for catalog SKUs.
4. **Purchase**: payment confirms **organization** entitlement where wired.
5. **Library**: `product_kind` (default `ebook`); **`delivery_mode`** `pdf` | `web_only` (`013`). **Download** when `pdf` + `storage_object_path` (`012`). **Read online** when `web_only` — MDX from `content/ebooks/<slug>/index.mdx`; first open recorded in `content_ebook_first_opens`.

## Schema

- `content_products` — catalog row; **`product_kind`**: `ebook` | `guide` | `template` | `bundle` (`010`); **`delivery_mode`**: `pdf` | `web_only` (`013`).
- `organization_content_entitlements` — org has access to a product after purchase or grant.
- `content_ebook_first_opens` — first in-app open per user/org/SKU for refund-policy workflows (`013`).
- `waitlist_signups` — marketing email signup; RLS: no public policies; inserts via service role from `POST /api/waitlist` only.

## Analytics (PostHog)

- **Event names** (single source: `src/lib/analytics/posthog-events.ts`): `elevate_funnel_*` (Library, Billing, purchase, download, ebook reader link/view); `elevate_blog_post_share_link_copied` (blog share — `slug`, `locale`); **`elevate_blog_post_viewed`** (blog read — `slug`, `locale`, `post_title` public title only); `elevate_waitlist_submitted` / `elevate_waitlist_submit_failed` (properties: `source`, `locale`, optional `http_status`); `elevate_marketing_cta_click` (property `cta_id` from `MarketingCtaId`, e.g. `hero_waitlist_anchor`, `hero_prompt_studio`, `hero_ebooks`).
- **Dashboards:** step-by-step funnel recipes: **[`docs/POSTHOG_FUNNELS.md`](./POSTHOG_FUNNELS.md)** (blog → waitlist, CTA → waitlist, etc.). Pageviews are auto-captured on marketing routes.

## Blog vs catalog (product narrative vs code)

| Channel | What users see | Access in code |
|--------|----------------|----------------|
| **Blog** | MDX under `content/blog/<locale>/…` | Public marketing routes; share link = normal web page (no paywall). |
| **Catalog / ebooks** | `content_products` + Library / Billing | Account + `profiles.organization_id`; read = **subscription OR entitlement**; `web_only` uses dashboard MDX reader (`content/ebooks/<slug>/index.mdx`), **no** signed Storage URL for that SKU. |

**Waitlist (`waitlist_signups`, `#waitlist`)** captures email for Prompt Studio / marketing. It does **not** gate signup or checkout in the codebase—if you need “whitelist-only purchase,” that would be a separate allowlist table + checks in billing routes (not implemented here).

**“No export” for web-only ebooks** means: no file download API path for the SKU; HTML is still rendered in the browser (copy, print, screenshots are not cryptographically prevented—policy + audit `content_ebook_first_opens`, not hard DRM).

## Known gaps (prioritized)

1. **Solo buyer** — today’s model is org-scoped; for strict B2C ebook, consider `user_id` on entitlements or a personal org.
2. **Ops** — create Storage bucket/policies; set `storage_object_path` on catalog rows; optional access logs.
3. **Analytics** — dashboards and alerts in PostHog are manual; optional server-side capture for waitlist (duplicate of client success) if you need backend-only verification.
4. **Invite-only commerce** — optional `allowlisted_email` / org flag before Toss confirm (backlog if product requires strict whitelist).
5. **Prompt Studio beta** — `prompt_studio_beta_allowlist` (migration `016`) + `/admin/prompt-studio-allowlist`; when `STUDIO_BETA_REQUIRE_ALLOWLIST=true`, `/dashboard/studio` requires profile email on the list (independent of waitlist and `catalog_purchase_allowlist`).

## Related

- **Who may read ebooks (subscription vs per-purchase):** [`docs/EBOOK_READ_ALLOWLIST.md`](./EBOOK_READ_ALLOWLIST.md)
- **Optional invite-only checkout (catalog Toss):** [`docs/CATALOG_PURCHASE_ALLOWLIST.md`](./CATALOG_PURCHASE_ALLOWLIST.md)
- Reflection / audit: [`memory-bank/reflect-ebook-content-funnel.md`](../memory-bank/reflect-ebook-content-funnel.md), [`memory-bank/reflect-mvp-waitlist-landing-audit.md`](../memory-bank/reflect-mvp-waitlist-landing-audit.md)
- gstack (YC-style review loops): [`docs/GSTACK.md`](GSTACK.md)
