# ADR-001: Toss Payments — domestic card PoC (Phase 2)

## Status

PoC implemented (Elevate app): 결제위젯 + **승인 API** + `toss_payment_intents` + `payment.confirmed` 감사 로그; 웹훅은 `PAYMENT_STATUS_CHANGED` 처리(선택). 실제 상용 과금·계약 전 단계.

## Context

Elevate targets the Korean market. [Toss Payments](https://www.tosspayments.com/) is a common acquirer/PSP for card acceptance. A PoC validates redirect/approve flow, webhook signatures, and idempotency before ticketing or subscription billing.

## Decision

- **PoC scope**: single test payment (small amount), server-side order creation, client redirect to Toss payment window, webhook callback to confirm payment, store `payment_key` / `order_id` in Postgres (future table).
- **Out of scope for PoC**: refunds, partial capture, subscriptions, VAT invoicing, PCI scope beyond redirect model.

## Environment (do not commit secrets)

| Variable | Purpose |
|----------|---------|
| `TOSS_MERCHANT_ID` | MID (상점아이디) — API 개별 연동 |
| `TOSS_CLIENT_KEY` | API 개별 연동 클라이언트 키 (`live_ck_…`) |
| `TOSS_SECRET_KEY` | API 개별 연동 시크릿 키 (`live_sk_…`) — server only |
| `NEXT_PUBLIC_TOSS_WIDGET_CLIENT_KEY` | 결제위젯 클라이언트 키 (`live_gck_…`) — browser |
| `TOSS_WIDGET_SECRET_KEY` | 결제위젯 시크릿 (`live_gsk_…`) — server |
| `TOSS_SECURITY_KEY` | 보안 키 (대시보드에서 복사; 일부 API/검증에 사용) |
| `NEXT_PUBLIC_APP_URL` | Must match registered success/fail URLs |

Register callback URLs in the Toss dashboard for each environment (local tunnel, Vercel preview, production).

## Integration notes

1. Create payment intent on the server with the secret key (never expose to the browser).
2. Return `paymentKey` / redirect URL to the client or use official Toss SDK per their current docs.
3. Webhook: verify signature header per Toss documentation; update order status idempotently by `orderId`.
4. `008_toss_payment_intents` — RLS `select`만(멤버); 쓰기는 서비스 롤.

## Consequences

- **Positive**: Realistic path for KR card acceptance; separates payment domain from core event RLS.
- **Negative**: Additional compliance (receipts, PG contract) before GA.

## References

- Toss developer documentation (latest): https://docs.tosspayments.com/
