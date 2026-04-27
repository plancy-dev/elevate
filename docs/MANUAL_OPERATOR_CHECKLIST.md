# 수동 운영 체크리스트 (Elevate)

에이전트·코드로 대체할 수 없는 **계정·비밀·대시보드·계약** 작업입니다. 스프린트 시작 시 검토하세요.

| 영역 | 할 일 |
| ---- | ------ |
| **Toss Payments** | 대시보드 성공/실패·웹훅 URL(`https://<도메인>/api/webhooks/toss`) 등록, 키 발급/로테이션, 상용 전 PG·세금·약관 점검 |
| **Supabase (필수)** | 스튜디오 운영 기준 마이그레이션 `034`(assembly jobs + claim RPC)·`035`(Realtime broadcast) 적용 여부 확인, `CONTENT_STORAGE_BUCKET`(기본 `elevate-content`) 존재/정책 점검 |
| **Video Worker (필수)** | Fly 배포 상태 확인(`fly machine list -a elevate-video-assembly`), `/health` 정상, 로그에 `[assembly-worker] poll loop started` 존재, worker/app이 동일 Supabase 프로젝트 사용 |
| **Publish/Buffer** | 조직 Buffer 키 저장 여부, 실패 row 재시도 버튼 동작(에피소드 단위/개별), `studio_scheduled_posts.last_error` 확인 절차 숙지 |
| **E2E 운영** | `tests/e2e/live-phase*.spec.ts`는 실제 artifact/job/예약 row를 생성하는 **mutation 테스트**임을 확인하고, 운영 데이터가 아닌 테스트 episode에서만 실행 |
| **Vercel / GitHub** | 프로덕션·프리뷰 환경 변수, E2E Secrets(`NEXT_PUBLIC_SUPABASE_*`, `E2E_USER_*`) 정합성 확인; `/dashboard` 접근 조건은 [`DEVELOPMENT.md`](./DEVELOPMENT.md) 참고 |
| **거버넌스** | [memory-bank/tasks.md](/memory-bank/tasks.md)·[activeContext.md](/memory-bank/activeContext.md) 최신화 |
| **gstack (선택)** | [docs/GSTACK.md](./GSTACK.md) — Bun, `./setup` |

## 운영자 빠른 점검 순서 (권장)

1. Supabase migration `034/035` + bucket/정책 확인
2. Worker health/log 확인
3. Dashboard에서 job enqueue 후 artifact 완료까지 end-to-end 확인
4. Publish scheduler에서 retry/cancel 동작 확인
5. 라이브 스모크 실행 전 테스트 episode 격리 여부 재확인

관련: [ADR-001](./adr/ADR-001-toss-payments-poc.md), [AI_AGENT_MATURITY_REPORT.md](./AI_AGENT_MATURITY_REPORT.md).
