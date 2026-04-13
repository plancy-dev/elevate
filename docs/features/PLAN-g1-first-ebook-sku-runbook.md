# G1 / M4 — First ebook SKU (runbook)

**Goal:** One **`web_only`** ebook in Library with MDX reader content in-repo, ready to attach a **Lemon** variant.  
**Prerequisite:** [`PLAN-g0-creator-commerce-decisions.md`](PLAN-g0-creator-commerce-decisions.md) (G0 locked).  
**Slug:** `prompt-surface-playbook`  
**MDX:** [`content/ebooks/prompt-surface-playbook/index.mdx`](../../content/ebooks/prompt-surface-playbook/index.mdx)

---

## 1. What’s already in the repo

- Reader route: `/dashboard/library/<slug>/read` loads `content/ebooks/<slug>/index.mdx` when `delivery_mode = web_only` and the org is entitled.
- Admin: `/admin/content` for catalog rows and Lemon variant links.

---

## 2. Insert `content_products` row

**Preferred:** apply the versioned migration so staging/prod stay aligned:

- File: [`supabase/migrations/022_content_product_prompt_surface_playbook.sql`](../../supabase/migrations/022_content_product_prompt_surface_playbook.sql)
- Local: `supabase db push` / `supabase migration up` (your usual workflow)
- Hosted: run pending migrations from CI or Supabase **Migrations** UI so `022` is applied

The SQL is **idempotent** (`on conflict (slug) do update`).

**If you must patch one environment by hand** (hotfix), you can paste the same `insert` into **SQL Editor**—keep it in sync with `022` so drift doesn’t accumulate.

Adjust **`price_cents`** / copy in a **new migration** if you change list price after launch (don’t edit `022` once it has shipped to prod unless you know the team’s migration policy).

---

## 3. Lemon variant

1. In **Lemon Squeezy**, create a product/variant priced to match **`price_cents`** / **`currency`** (see G0: USD list price).  
2. In **Elevate** `/admin/content`, open the row and attach **variant ID** (and product ID if required) per [`PLAN-lemon-operator-catalog-sync.md`](PLAN-lemon-operator-catalog-sync.md).  
3. Ensure checkout passes **`custom_data`** (`organization_id`, `content_product_slug` or `content_product_id`) so the webhook grants the right org.

---

## 4. Smoke test

1. **Org with test user** — purchase via Lemon test mode (when store allows).  
2. **Library** — product appears; **Read online** opens the MDX reader.  
3. **PostHog** — `elevate_funnel_ebook_reader_view` (and related funnel events) fire per [`POSTHOG_FUNNELS.md`](../POSTHOG_FUNNELS.md).

---

## 5. Rollout checklist

- [ ] Catalog row active in prod  
- [ ] Lemon link attached  
- [ ] Terms / refund copy aligned with G0 MoR draft  
- [ ] Marketing CTA points to catalog or checkout entry you want (`/product/...`, Library, or billing deep link)

---

## 6. Implementation review (codebase)

Verified end-to-end shape:

| Layer | Notes |
|-------|--------|
| **Catalog** | `content_products.slug` = `prompt-surface-playbook`, `delivery_mode = web_only`, `is_active = true` |
| **Library detail** | `/dashboard/library/[slug]` — entitlement via subscription **or** `organization_content_entitlements` ([`ebook-access.ts`](../../src/lib/content/ebook-access.ts)) |
| **Checkout** | `/dashboard/library/[slug]/checkout` → Lemon API checkout when variant linked + env; `custom_data` includes `content_product_id`, `content_product_slug`, `organization_id` ([`resolve-lemon-checkout-for-billing.ts`](../../src/lib/payments/resolve-lemon-checkout-for-billing.ts)) |
| **Webhook** | `order_created` + paid → grant org entitlement ([`lemon-squeezy-webhook.ts`](../../src/lib/payments/lemon-squeezy-webhook.ts)); fallback org resolution by buyer email if `organization_id` missing |
| **Reader** | `/dashboard/library/[slug]/read` — loads [`content/ebooks/<slug>/index.mdx`](../../content/ebooks/prompt-surface-playbook/index.mdx) via [`loadEbookMdxSource`](../../src/lib/content/ebook-mdx.ts) |

**Refactor:** Library product-by-slug now uses **one DB query per slug** + shared entitlement context ([`getLibraryEntitlementContext`](../../src/lib/data/library.ts)) instead of loading the full catalog on every detail page.
