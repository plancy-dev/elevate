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

## 2. Insert `content_products` row (Supabase SQL)

Run in **SQL Editor** (service role / dashboard) against your project. Adjust `price_cents` to match your Lemon variant before launch.

```sql
insert into public.content_products (
  slug,
  title,
  description,
  price_cents,
  currency,
  product_kind,
  delivery_mode,
  is_active,
  storage_object_path
) values (
  'prompt-surface-playbook',
  'The Prompt Is Your Product Surface — Playbook',
  'A short playbook for teams who want prompts to behave like an owned product surface—before compliance and voice drift in chat threads.',
  1900,
  'USD',
  'ebook',
  'web_only',
  true,
  null
)
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  price_cents = excluded.price_cents,
  currency = excluded.currency,
  product_kind = excluded.product_kind,
  delivery_mode = excluded.delivery_mode,
  is_active = excluded.is_active;
```

Then: `pnpm db:types` locally if you regenerate types from that project.

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
