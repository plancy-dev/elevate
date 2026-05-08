# Phase 2 — 환경 변수·운영 체크리스트

## Supabase

1. **`007_audit_logs.sql`**  
   SQL Editor에서 실행했는지 확인 (감사 로그 테이블 + RLS). 이미 `006`까지 적용했다면 이어서 `007`만 실행하면 됩니다.

2. **감사 로그가 비어 있을 때**  
   목록 조회는 로그인 사용자의 RLS로 이루어지고, **쓰기(insert)는 서버의 `SUPABASE_SERVICE_ROLE_KEY`로만** 수행됩니다. 마이그레이션을 적용했는데도 저장 후에도 항목이 없으면 `.env.local`(또는 배포 환경 변수)에 서비스 롤 키가 있는지 확인하고, 로컬에서는 `pnpm dev`를 재시작하세요. 개발 모드에서는 감사 insert 실패 시 터미널에 `[audit] ...` 경고가 출력됩니다.

3. **타입 재생성 (선택)**  
   원격 스키마와 맞추려면: `pnpm db:types`

## PostHog

1. [PostHog](https://posthog.com/)에서 프로젝트 생성.
2. Project API key와 호스트 복사 (키 접두사는 프로젝트/제품에 따라 `phc_…`, `phx_…` 등일 수 있음):
   - US 기본: `https://us.i.posthog.com`
   - EU: `https://eu.i.posthog.com`
3. 로컬/배포 환경에 설정 (예: Vercel Environment Variables):

```bash
NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

키는 **절대** 저장소에 커밋하지 말고 대시보드·`.env.local`에만 둡니다.  
설정이 없으면 앱은 PostHog를 로드하지 않고 동작합니다.

## Payments — Lemon Squeezy + Polar (operational)

카탈로그·빌링은 **Lemon Squeezy** 호스트 체크아웃 + `POST /api/webhooks/lemonsqueezy`; 블로그 구독 등은 **Polar** + `POST /api/webhooks/polar`. 변수 표·운영 순서: [`docs/adr/ADR-004-lemon-squeezy-global-payments.md`](./adr/ADR-004-lemon-squeezy-global-payments.md), [`docs/features/PLAN-lemon-squeezy-webhook.md`](./features/PLAN-lemon-squeezy-webhook.md), 루트 **`.env.local.example`**.

**Legacy DB:** 마이그레이션 **`008_toss_payment_intents.sql`** 가 이미 적용된 프로젝트에는 테이블이 남을 수 있으나 **앱은 사용하지 않음** (2026-05 제거) — [`docs/adr/ADR-005-payment-rails-lemon-primary-toss-deferred.md`](./adr/ADR-005-payment-rails-lemon-primary-toss-deferred.md). 역사적 Toss env 표는 [`docs/adr/ADR-001-toss-payments-poc.md`](./adr/ADR-001-toss-payments-poc.md).
