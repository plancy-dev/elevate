# Lemon Squeezy — operator catalog sync & checkout (plan)

## gstack-style review (condensed)

- **CEO / product**: Operators should attach payments without redeploying env JSON per SKU. Source of truth for “which Lemon variant sells this catalog row” must live beside the catalog, editable by platform admin.
- **Eng**: Lemon documents `POST /v1/checkouts` with `checkout_data.custom` for webhook correlation; `GET /v1/products` and `GET /v1/variants` support pickers. Programmatic **product creation** is not a first-class documented flow in the same way—teams typically create products in Lemon (MoR), then link variant IDs in Elevate.
- **Design / trust**: Variant IDs are stored in `content_product_lemon_links` (service role only), not on publicly readable catalog rows, so marketing/anon catalog reads do not leak payment integration IDs.

## Implementation (shipped in repo)

1. **Migration `019_content_product_lemon_links.sql`** — FK to `content_products`, RLS enabled with **no** JWT policies (service role only).
2. **Server env** — `LEMON_SQUEEZY_API_KEY`, `LEMON_SQUEEZY_STORE_ID`, optional `LEMON_SQUEEZY_TEST_MODE`.
3. **API module** — `src/lib/payments/lemon-squeezy-api.ts` (list products/variants, create checkout).
4. **Billing** — `resolveLemonCheckoutForBillingPage` prefers API checkout (embeds `organization_id`, `content_product_id`, `content_product_slug`); falls back to legacy `NEXT_PUBLIC_LEMON_CHECKOUT_URL_BY_SLUG`.
5. **Admin** — Library catalog table: paste variant ID, or **Browse** Lemon store → pick product → pick variant.

## Follow-ups (not blocking)

- **Price/currency alignment**: Checkout passes `custom_price` from `content_products.price_cents`; ensure Lemon store currency/variant pricing matches operational expectations.
- **Rate limits**: Lemon allows ~300 API calls/minute; billing creates one checkout per page load when using API mode—add short-lived caching if traffic grows.
- **Full “create product on Lemon from Elevate”**: Revisit if/when Lemon documents stable create-product endpoints for your account type; until then, create products in Lemon, link variants here.

## References

- Create checkout: https://docs.lemonsqueezy.com/api/checkouts/create-checkout  
- List products: https://docs.lemonsqueezy.com/api/products/list-all-products  
- Webhook + entitlements: `docs/adr/ADR-004-lemon-squeezy-global-payments.md`
