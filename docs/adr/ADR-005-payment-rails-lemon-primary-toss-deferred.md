# ADR-005: Payment rails — Lemon primary; Toss deferred for new catalog work

**Status:** Accepted (2026-04)  
**Context:** Phase G0/G1 need a clear default so engineering and marketing don’t split attention across two checkout stories.  
**Supersedes:** Nothing in code; **narrows** informal “Toss vs Lemon” discussions to a single primary path for **new** commerce.

---

## Decision

1. **Lemon Squeezy** is the **primary** payment rail for **global** ebook/guide SKUs tied to `content_products` (variant link + webhook → `organization_content_entitlements`), as in [`ADR-004`](./ADR-004-lemon-squeezy-global-payments.md).

2. **Toss Payments** is **out of scope** for **new** catalog or billing features until the product explicitly prioritizes KR-only flows again. The Toss PoC **was removed from the app** (2026-05): no SDK, widget, server actions, or `/api/webhooks/toss`. The database table **`public.toss_payment_intents`** from migration **`008_toss_payment_intents.sql`** may still exist as **legacy only** (still visible in `src/types/database.types.ts` until Supabase schema is dropped and `pnpm db:types` is re-run). **Do not** add new product code against it without a new ADR. Historical PoC description: [`ADR-001`](./ADR-001-toss-payments-poc.md).

3. **SKU mapping** for Lemon: unchanged from ADR-004 / [`docs/features/PLAN-lemon-squeezy-webhook.md`](../features/PLAN-lemon-squeezy-webhook.md) — `content_product_lemon_links`, `custom_data` on checkout, idempotent order processing.

---

## Consequences

- **Docs and runbooks** should describe **Lemon + Polar** webhooks and env only; Toss is **historical** ([`ADR-001`](./ADR-001-toss-payments-poc.md)) plus optional **legacy DB** per decision §2 above.
- **G2** work focuses on Lemon webhook reliability, testing, and ops—not feature parity with Toss.
- Re-enabling Toss for production catalog requires a **new ADR** or amendment with explicit KR GTM justification.

---

## Legacy table removal (operator — **no auto migration**)

**Default (until team explicitly chooses to drop data):** keep the table; it is unused by the app and documented as legacy in decision §2.

**When the team agrees to remove the table:** run the **manual draft** (not `supabase/migrations/`): [`docs/operations/draft-drop-toss-payment-intents.sql`](../operations/draft-drop-toss-payment-intents.sql). Then **`pnpm db:types`** so `src/types/database.types.ts` matches Supabase.

**Do not** add a numbered `migrations/*.sql` DROP in this repo without an explicit issue/ADR amendment tied to a scheduled apply — avoids surprise applies on environments that replay migrations.

## Related

- [`docs/features/PLAN-g0-creator-commerce-decisions.md`](../features/PLAN-g0-creator-commerce-decisions.md)  
- [`docs/CONTENT_FUNNEL.md`](../CONTENT_FUNNEL.md)  
