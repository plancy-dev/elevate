# Active Context — Elevate

## 현재 페이즈

**Phase 1 — MVP · Phase 2 준비**  
1D 완료: `src/proxy.ts`, `src/types/database.types.ts` + Supabase 클라이언트 제네릭, `pnpm db:types`. 다음 우선: **Phase 2** (조직 초대·분석 등) 또는 Vercel 운영 점검.

## 최근 확정 결정

| 주제 | 결정 |
|------|------|
| 세션 편집 | `admin`/`organizer`/`coordinator`만 UI 노출 · RLS는 기존 `Organizers can manage sessions` |
| 세션 폼 | 이벤트 상세 내 패널 · `revalidateEventAndDashboard` |

## 코드베이스 앵커

| 영역 | 위치 |
|------|------|
| 세션 서버 액션 | `src/actions/sessions.ts` |
| 참석자 서버 액션 | `src/actions/attendees.ts` |
| 참석자 UI | `src/components/dashboard/attendees-page-client.tsx`, `src/app/(dashboard)/dashboard/attendees/page.tsx` |
| 요청 경계 (`proxy`) | `src/proxy.ts` → `src/lib/supabase/update-session.ts` |
| DB 타입 | `src/types/database.types.ts` (`pnpm db:types`) |
| 이벤트 상세 UI | `src/components/dashboard/event-sessions-panel.tsx`, `src/app/(dashboard)/dashboard/events/[id]/page.tsx` |
| 이벤트 데이터 | `src/lib/data/events.ts` (`getEventDetailPageData`) |

## AI / Cursor

- **`memory-bank/tasks.md`** — 단일 우선순위
