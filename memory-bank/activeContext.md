# Active Context — Elevate

## 현재 페이즈

**Phase 2 — Growth (백로그 핵심 반영)**  
팀·초대·분석·감사 로그(`007` + `/dashboard/audit`)·PostHog(옵션 env)·Toss ADR + `/dashboard/billing` 안내. 세부: `docs/PHASE2_ENV.md`.

## 최근 확정 결정

| 주제 | 결정 |
|------|------|
| 세션 편집 | `admin`/`organizer`/`coordinator`만 UI 노출 · RLS는 기존 `Organizers can manage sessions` |
| 세션 폼 | 이벤트 상세 내 패널 · `revalidateEventAndDashboard` |

## 검수 메모 (Phase 2 마감)

- 감사 로그: 마이그레이션 미적용·RLS 오류 시 빈 목록 대신 에러 문구 표시 (`/dashboard/audit`).
- 타임스탬프: UTC 고정 표기로 SSR/클라이언트 하이드레이션 시 locale 편차 완화 (`formatDateTimeUtc`).
- 감사 **쓰기**는 `SUPABASE_SERVICE_ROLE_KEY` 필수; 실패 시 프로덕션은 무시, 개발은 `[audit]` 터미널 경고.
- 다음 작업 후보: `memory-bank/tasks.md` 표 참고 (Toss 실연동, E2E 확장 등).

## 다음 INIT 권장 포커스

1. **Toss PoC 운영**: `008` 마이그레이션 적용·`pnpm db:types`; Toss 대시보드에 **성공/실패 URL** 등록; 웹훅은 ngrok/Vercel 배포 후 `/api/webhooks/toss` 연결.
2. **감사 로그**: Billing 테스트 결제 후 `payment.intent_create` / `payment.confirmed` / `payment.webhook_status` 확인.
3. **후속**: 환불·부분 취소·구독 모델·영수증 등 ADR 범위 밖.

## 코드베이스 앵커

| 영역 | 위치 |
|------|------|
| 세션 서버 액션 | `src/actions/sessions.ts` |
| 참석자 서버 액션 | `src/actions/attendees.ts` |
| 참석자 UI | `src/components/dashboard/attendees-page-client.tsx`, `src/app/(dashboard)/dashboard/attendees/page.tsx` |
| 요청 경계 (`proxy`) | `src/proxy.ts` → `src/lib/supabase/update-session.ts` |
| DB 타입 | `src/types/database.types.ts` (`pnpm db:types`) |
| 팀·초대 | `src/app/(dashboard)/dashboard/team`, `src/actions/invitations.ts`, `src/app/invite/page.tsx` |
| 이벤트 상세 UI | `src/components/dashboard/event-sessions-panel.tsx`, `src/app/(dashboard)/dashboard/events/[id]/page.tsx` |
| 이벤트 데이터 | `src/lib/data/events.ts` (`getEventDetailPageData`) |

## AI / Cursor

- **`memory-bank/tasks.md`** — 단일 우선순위
