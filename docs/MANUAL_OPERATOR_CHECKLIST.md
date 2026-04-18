# 수동 운영 체크리스트 (Elevate)

에이전트·코드로 대체할 수 없는 **계정·비밀·대시보드·계약** 작업입니다. 스프린트 시작 시 검토하세요.

| 영역 | 할 일 |
|------|--------|
| **Toss Payments** | 대시보드에 성공/실패·웹훅 URL 등록 (`https://<도메인>/api/webhooks/toss`), 키 발급·로테이션, 상용 전 PG·세금·약관 |
| **Supabase** | 마이그레이션 `011`–`012` 적용, Storage 버킷(`CONTENT_STORAGE_BUCKET`, 기본 `elevate-content`)·정책, `content_products.storage_object_path`·PoC 가격 `price_cents` = **10000**(100원 표시) |
| **PostHog** | 프로젝트·`NEXT_PUBLIC_*` 키, 퍼널 대시보드, [이벤트 이름 합의](/src/lib/analytics/posthog-events.ts) |
| **Vercel / GitHub** | 프로덕션·프리뷰 환경 변수, E2E용 Secrets (`NEXT_PUBLIC_SUPABASE_*`); **`/dashboard`**는 `profiles.dashboard_access` + 서버 `SUPABASE_SERVICE_ROLE_KEY` 필요 — [`DEVELOPMENT.md`](./DEVELOPMENT.md) § Dashboard access |
| **거버넌스** | [memory-bank/tasks.md](/memory-bank/tasks.md)·[activeContext.md](/memory-bank/activeContext.md) 갱신 |
| **gstack (선택)** | [docs/GSTACK.md](./GSTACK.md) — Bun, `./setup` |

관련: [ADR-001](./adr/ADR-001-toss-payments-poc.md), [AI_AGENT_MATURITY_REPORT.md](./AI_AGENT_MATURITY_REPORT.md).
