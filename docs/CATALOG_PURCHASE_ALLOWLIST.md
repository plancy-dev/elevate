# Catalog checkout allowlist (invite-only payment gate)

When **`CATALOG_CHECKOUT_REQUIRE_ALLOWLIST=true`** (server env), only profile emails present in **`catalog_purchase_allowlist`** can:

1. Start **Lemon Squeezy** hosted checkout for a catalog SKU (server checks before redirect).
2. Complete hosted checkout and return to app success/fail routes (no separate in-app payment-confirm step).
3. Have the **Lemon** order **`order_created`** webhook grant entitlements — if the payer’s email is not allowed, processing **skips** grant (audit / webhook path; see `src/lib/payments/lemon-squeezy-webhook.ts`).

This is **not** the marketing waitlist (`waitlist_signups`). Match is on **`profiles.email`**, normalized with `lower(trim(...))`.

## Operations

1. Apply migration **`043_catalog_purchase_allowlist.sql`**
2. Add emails via **`/admin/purchase-allowlist`** (platform admin shell) or SQL `insert into public.catalog_purchase_allowlist (email_normalized) values ('user@example.com');`
3. Set env in production: `CATALOG_CHECKOUT_REQUIRE_ALLOWLIST=true`

Default unset/false keeps previous behavior (no allowlist) for local dev.

## Related

- `src/lib/env/catalog-checkout.ts`
- `src/lib/payments/assert-catalog-checkout-allowlist.ts`
- `docs/EBOOK_READ_ALLOWLIST.md` (who may **read** after purchase)
