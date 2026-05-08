# ADR-004: Lemon Squeezy — global MoR payments & webhooks (Phase G)

## Status

In progress — webhook + entitlements shipped; operator-managed variant links (`content_product_lemon_links`) + `POST /v1/checkouts` for billing shipped; see `docs/features/PLAN-lemon-operator-catalog-sync.md`. Refunds/chargeback revocation remain follow-ups.

## Context

Elevate uses **Lemon Squeezy** as Merchant of Record for international card/tax handling on the catalog (legacy KR-only Toss PoC was removed from the app — [`ADR-005`](./ADR-005-payment-rails-lemon-primary-toss-deferred.md)). Orders must map to existing `content_products` and `organization_content_entitlements` without duplicating business rules per PSP.

## Decision (draft)

- **Webhook endpoint**: `POST /api/webhooks/lemonsqueezy` — verify `X-Signature` (HMAC-SHA256 hex of **raw body**), read `X-Event-Name` / `meta.event_name`, handle `order_created` when `attributes.status === paid`.
- **Idempotency**: `attributes.identifier` (order UUID) stored in `lemon_squeezy_processed_orders` after a successful grant path.
- **SKU mapping**: `meta.custom_data.content_product_slug` or `content_product_id`, else optional env JSON `LEMON_SQUEEZY_VARIANT_TO_CONTENT_SLUG` keyed by Lemon `first_order_item.variant_id`.
- **Org resolution**: `meta.custom_data.organization_id` (UUID) if present and valid; else match `profiles.email` to `user_email` (first org membership).
- **Allowlist**: When `CATALOG_CHECKOUT_REQUIRE_ALLOWLIST=true`, enforce `catalog_purchase_allowlist` against profile id when known, else normalized buyer email (see `src/lib/payments/assert-catalog-checkout-allowlist.ts`).
- **Out of scope (MVP)**: automatic revocation on refund/chargeback; subscription/license-key products — document in PLAN before enabling.

## Environment (do not commit secrets)

| Variable | Purpose |
|----------|---------|
| `LEMON_SQUEEZY_WEBHOOK_SECRET` | Signing secret from Lemon webhook settings — must match dashboard |
| `LEMON_SQUEEZY_VARIANT_TO_CONTENT_SLUG` | Optional JSON map, e.g. `{"12345":"my-ebook-slug"}` |
| `SUPABASE_SERVICE_ROLE_KEY` | Required for webhook DB writes (existing) |

## Consequences

- **Positive**: Single entitlement model for catalog (Lemon); raw-body signature matches Lemon docs.
- **Negative**: Checkout must pass `custom_data` for reliable org/SKU mapping when email/org inference is insufficient.

## References

- Webhook requests: https://docs.lemonsqueezy.com/help/webhooks/webhook-requests  
- Signing: https://docs.lemonsqueezy.com/help/webhooks/signing-requests  
- Feature plan: `docs/features/PLAN-lemon-squeezy-webhook.md`
