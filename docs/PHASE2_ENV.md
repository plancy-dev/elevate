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
# or: NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

키는 **절대** 저장소에 커밋하지 말고 대시보드·`.env.local`에만 둡니다.  
설정이 없으면 앱은 PostHog를 로드하지 않고 동작합니다.

## Toss Payments (PoC)

실제 결제 연동 전 단계입니다.

1. [Toss Payments 개발자](https://developers.tosspayments.com/)에서 테스트 키 발급.
2. `docs/adr/ADR-001-toss-payments-poc.md`의 변수 표 참고 후 서버 전용 시크릿은 **서버 env**에만 저장 (`TOSS_SECRET_KEY` 등).
3. 앱의 `/dashboard/billing`에서 **결제위젯 PoC**(고정 **100원** 테스트)를 쓰려면:
   - `NEXT_PUBLIC_TOSS_WIDGET_CLIENT_KEY` (브라우저)
   - 승인 API: `TOSS_WIDGET_SECRET_KEY` (위젯 시크릿) 우선, 없으면 `TOSS_SECRET_KEY` (API 개별 시크릿)
   - `NEXT_PUBLIC_APP_URL`과 동일한 호스트로 Toss 대시보드에 **성공/실패 URL** 등록:  
     `{APP_URL}/dashboard/billing/success`, `{APP_URL}/dashboard/billing/fail`
   - DB: **`008_toss_payment_intents.sql`** 적용 후 `pnpm db:types` 권장
   - 웹훅(선택): 공개 URL이 필요 — `https://<host>/api/webhooks/toss` (로컬은 ngrok 등)
