# Catalog checkout allowlist (invite-only payment gate)

When **`CATALOG_CHECKOUT_REQUIRE_ALLOWLIST=true`** (server env), only profile emails present in **`catalog_purchase_allowlist`** can:

1. Create a Toss payment intent (`createTossPaymentIntent`)
2. Confirm payment on the success redirect (`confirmTossPaymentFromRedirect`) — for **pending** intents only; already-confirmed intents skip the gate
3. Have the payment **webhook** confirm and grant entitlements — if the payer’s email is not allowed, the webhook **does not** update the intent or grant access (audit log metadata: `skipped: checkout_allowlist`)

This is **not** the marketing waitlist (`waitlist_signups`). Match is on **`profiles.email`**, normalized with `lower(trim(...))`.

## Operations

1. Apply migration **`014_catalog_purchase_allowlist.sql`**
2. Add emails via **`/admin/purchase-allowlist`** (platform admin shell) or SQL `insert into public.catalog_purchase_allowlist (email_normalized) values ('user@example.com');`
3. Set env in production: `CATALOG_CHECKOUT_REQUIRE_ALLOWLIST=true`

Default unset/false keeps previous behavior (no allowlist) for local dev.

## Related

- `src/lib/env/catalog-checkout.ts`
- `src/lib/payments/assert-catalog-checkout-allowlist.ts`
- `docs/EBOOK_READ_ALLOWLIST.md` (who may **read** after purchase)
