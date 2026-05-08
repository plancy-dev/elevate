# PLAN — Lemon Squeezy webhook → content entitlement (Phase G2)

## Goal

When a **paid** Lemon Squeezy order is created, grant **`organization_content_entitlements`** for the correct `content_products` row, idempotently, with audit logs on the grant path.

## Endpoint

- **URL**: `https://<production-domain>/api/webhooks/lemonsqueezy`  
- **Method**: `POST`  
- **Headers**: `Content-Type: application/json`, `X-Event-Name`, `X-Signature`  
- **Body**: JSON:API resource (see Lemon docs — `meta.custom_data`, `data.attributes`).

## Security

1. Read **raw body** as text; verify `X-Signature` with HMAC-SHA256 (hex) using `LEMON_SQUEEZY_WEBHOOK_SECRET`.  
2. Do not trust client-supplied org/SKU without validation: org UUID must exist; product must resolve to an **active** `content_products` row.  
3. Production requires `LEMON_SQUEEZY_WEBHOOK_SECRET`; development may omit (signature skipped with warning).

## Events

| Event (v1) | Action |
|------------|--------|
| `order_created` | If `attributes.status === paid` and not `refunded`, attempt grant (see mapping). |
| Others | No-op; return `200 { received: true }`. |

## Mapping rules (priority)

1. **Content product**  
   - `meta.custom_data.content_product_id` (UUID) if present and active, else  
   - `meta.custom_data.content_product_slug` if present and active, else  
   - `LEMON_SQUEEZY_VARIANT_TO_CONTENT_SLUG`[`String(variant_id)`] → slug → active product.

2. **Organization**  
   - `meta.custom_data.organization_id` (UUID) if organization exists, else  
   - First `profiles` row with `email === attributes.user_email` (normalized) and non-null `organization_id`.

3. **Actor for audit**  
   - Profile matching org + buyer email when possible; else org `admin` profile; else any org member.

4. **Catalog allowlist** (`CATALOG_CHECKOUT_REQUIRE_ALLOWLIST=true`)  
   - If `profiles.id` known: same allowlist check as the Lemon webhook server path (`assertCatalogCheckoutAllowlist` semantics).  
   - Else: allowlist check on normalized buyer email.

## Idempotency

- **Key**: `attributes.identifier` (Lemon order UUID string).  
- **Store**: Row in `lemon_squeezy_processed_orders` after successful grant + ledger insert.  
- **Retries**: Duplicate webhooks return `200` without double grant (`organization_content_entitlements` is also unique per org+product).

## Refunds / chargebacks

**Not implemented in v1.** If product policy requires revocation, add a follow-up task (webhook `order_refunded` or order updated) and define whether to delete entitlement or mark suspended.

## Manual checklist (operator)

1. **Lemon Dashboard**: Create webhook → URL above → set signing secret → copy secret to `LEMON_SQUEEZY_WEBHOOK_SECRET`.  
2. **Checkout / payment link**: Configure **Custom data** so at least one of: `organization_id`, `content_product_slug` (or `content_product_id`), depending on storefront UX.  
3. **Env**: Set secret + optional variant map on Vercel/hosting.  
4. **Database**: Apply migration `018_lemon_squeezy_processed_orders.sql` (Supabase SQL or CLI).  
5. **Smoke test**: Lemon test mode order → confirm Library entitlement for the org.

## Code references

- `src/app/api/webhooks/lemonsqueezy/route.ts`  
- `src/lib/payments/lemon-squeezy-signature.ts`  
- `src/lib/payments/lemon-squeezy-webhook.ts`  
- `src/lib/payments/content-entitlement.ts`  
- **Legacy (removed):** Toss PoC webhook was `src/app/api/webhooks/toss/route.ts` — not in tree; see [`docs/adr/ADR-001-toss-payments-poc.md`](../adr/ADR-001-toss-payments-poc.md).
