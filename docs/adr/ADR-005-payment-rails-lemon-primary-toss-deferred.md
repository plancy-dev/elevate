# ADR-005: Payment rails — Lemon primary; Toss deferred for new catalog work

**Status:** Accepted (2026-04)  
**Context:** Phase G0/G1 need a clear default so engineering and marketing don’t split attention across two checkout stories.  
**Supersedes:** Nothing in code; **narrows** informal “Toss vs Lemon” discussions to a single primary path for **new** commerce.

---

## Decision

1. **Lemon Squeezy** is the **primary** payment rail for **global** ebook/guide SKUs tied to `content_products` (variant link + webhook → `organization_content_entitlements`), as in [`ADR-004`](./ADR-004-lemon-squeezy-global-payments.md).

2. **Toss Payments** is **out of scope** for **new** catalog or billing features until the product explicitly prioritizes KR-only flows again. Existing Toss PoC code paths ([`ADR-001`](./ADR-001-toss-payments-poc.md)) may remain for legacy or experiments; **do not** extend Toss for the first commercial ebook SKU.

3. **SKU mapping** for Lemon: unchanged from ADR-004 / [`docs/features/PLAN-lemon-squeezy-webhook.md`](../features/PLAN-lemon-squeezy-webhook.md) — `content_product_lemon_links`, `custom_data` on checkout, idempotent order processing.

---

## Consequences

- **Docs and runbooks** should describe **Lemon-first** checkout for the catalog; Toss is mentioned only as historical/optional KR PoC.
- **G2** work focuses on Lemon webhook reliability, testing, and ops—not feature parity with Toss.
- Re-enabling Toss for production catalog requires a **new ADR** or amendment with explicit KR GTM justification.

---

## Related

- [`docs/features/PLAN-g0-creator-commerce-decisions.md`](../features/PLAN-g0-creator-commerce-decisions.md)  
- [`docs/CONTENT_FUNNEL.md`](../CONTENT_FUNNEL.md)  
