# G0 — Creator commerce decisions (locked)

**Status:** Locked for Phase G execution (2026-04).  
**Supersedes informal notes:** Toss is **not** in scope for new catalog flows until product asks; **Lemon Squeezy** is the primary rail for global ebook/guide checkout.  
**Related:** [`ADR-005-payment-rails-lemon-primary-toss-deferred.md`](../adr/ADR-005-payment-rails-lemon-primary-toss-deferred.md) · [`CONTENT_FUNNEL.md`](../CONTENT_FUNNEL.md) · [`PLAN-g1-first-ebook-sku-runbook.md`](PLAN-g1-first-ebook-sku-runbook.md)

---

## 1. First ebook — topic & promise

| Field | Decision |
|-------|----------|
| **Working title** | *The Prompt Is Your Product Surface — Playbook* |
| **One-line promise** | Give teams a **short, repeatable way** to treat prompts as **owned surfaces**—so quality, compliance, and voice don’t drift in Slack threads. |
| **Audience** | Marketing/product leaders and operators who already use AI tools daily; aligns with the flagship blog thesis. |
| **Starting locale (content)** | **English (`en`)** first: MDX source of truth lives under `content/ebooks/<slug>/`. Korean (or other) editions are a **follow-on** once the EN SKU is selling or traffic justifies translation—not blocking G1. |

---

## 2. Price, currency, refund, tax (MoR draft)

| Topic | Draft policy |
|-------|----------------|
| **List currency** | **USD** on the Lemon checkout variant (global buyers, single price to start). |
| **List price (placeholder)** | Set on the **Lemon variant** and mirrored in `content_products.price_cents` (e.g. **$19.00** = `1900` cents)—adjust before public launch; G0 does not fix final price. |
| **Tax / VAT** | **Lemon Squeezy** acts as Merchant of Record where supported; tax handling follows [Lemon’s MoR documentation](https://docs.lemonsqueezy.com/help/getting-started/what-is-lemonsqueezy). Elevate does not calculate tax lines in-app for Lemon checkouts. |
| **Refunds** | Customer-facing policy should reference **Lemon’s order/refund flow** and Elevate **Terms** in sync. Product entitlement revocation on refund is **not** automated in v1 (see [`ADR-004`](../adr/ADR-004-lemon-squeezy-global-payments.md)); treat as follow-up if required. |
| **Chargebacks** | Same as ADR-004 — operational follow-up, not blocking G0 text. |

---

## 3. Payment rails (summary)

- **Lemon Squeezy:** Primary path for **international card** + MoR; variant ↔ catalog via `content_product_lemon_links` + webhook `custom_data`.  
- **Toss (KR):** **Deferred** for new work—no new Toss-first catalog flows until explicitly prioritized; existing PoC code may remain for legacy scenarios.  
- **SKU mapping:** Lemon `variant_id` → `content_products` row; webhook uses `organization_id` / `content_product_slug` in custom data per existing PLAN/ADR.

---

## 4. Next implementation steps

1. [`PLAN-g1-first-ebook-sku-runbook.md`](PLAN-g1-first-ebook-sku-runbook.md) — insert catalog row, attach Lemon variant, smoke Library → reader.  
2. Phase **G2** hardening — production webhook secrets, test-mode purchase → entitlement (existing codebase + ops).  

---

## 5. Review cadence

Revisit **price**, **locale priority**, and **refund copy** before the first paid marketing push; this G0 doc is the anchor for those conversations.
