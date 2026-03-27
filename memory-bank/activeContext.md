# Active Context — Elevate

## 현재 페이즈

**Phase 1 — MVP · 1B~1C**  
Session CRUD 완료. 다음 우선: **1C 참석자** (CSV·체크인) 또는 **1D** `middleware`→`proxy`, Supabase 타입 생성.

## 최근 확정 결정

| 주제 | 결정 |
|------|------|
| 세션 편집 | `admin`/`organizer`/`coordinator`만 UI 노출 · RLS는 기존 `Organizers can manage sessions` |
| 세션 폼 | 이벤트 상세 내 패널 · `revalidateEventAndDashboard` |

## 코드베이스 앵커

| 영역 | 위치 |
|------|------|
| 세션 서버 액션 | `src/actions/sessions.ts` |
| 이벤트 상세 UI | `src/components/dashboard/event-sessions-panel.tsx`, `src/app/(dashboard)/dashboard/events/[id]/page.tsx` |
| 이벤트 데이터 | `src/lib/data/events.ts` (`getEventDetailPageData`) |

## AI / Cursor

- **`memory-bank/tasks.md`** — 단일 우선순위
