# Domain Knowledge — MICE

**MICE** = **M**eetings, **I**ncentives, **C**onferences, **E**xhibitions (전시·회의·인센티브 여행 등 B2B 이벤트 산업).

## Elevate에서의 개념 매핑

| 도메인 | 제품 개념 |
|--------|-----------|
| 행사 단위 | `events` (기간·상태·예산·매출) |
| 행사 내 세부 일정 | `sessions` (발표·룸·정원) |
| 참가자 | `attendees` (등록 유형, 체크인, NPS) |
| 장소 | `venues` (용량·주소) |
| 테넌트 | `organizations` + `profiles` 역할 |

## 상태 (`event_status`)

`draft` → `planning` → `registration_open` → `live` → `completed` / `cancelled`

운영자 워크플로우에 맞춰 UI 카피·배지는 `EVENT_STATUS_LABEL` 등과 일치시킨다.

## 역할 (`user_role`)

`admin` > `organizer` > `coordinator` > `viewer` — RLS와 UI 버튼 노출을 맞출 것.
