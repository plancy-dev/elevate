# Domain Knowledge — Elevate AI Platform

**North Star**: [`creative-elevate-ai-pivot.md`](creative-elevate-ai-pivot.md)

## Current product concepts (pivot)

| 도메인 | 제품 개념 |
|--------|-----------|
| 조직 | `organizations` — 멀티테넌트, 플랜·결제·권한의 루트 |
| 프로필 | `profiles` — Auth 연동, 역할, `organization_id` |
| 콘텐츠 카탈로그 | `content_products` — 판매 단위 메타데이터; **`product_kind`**: `ebook`(기본) → `guide` / `template` / `bundle` |
| 권한(엔타이틀먼트) | `organization_content_entitlements` — 조직이 어떤 콘텐츠에 접근하는지 |
| 대시보드 접근 (운영 플래그) | `DASHBOARD_ACCESS_STRICT=true`일 때 이메일이 `waitlist_signups` 또는 `prompt_studio_beta_allowlist`에 있거나 플랫폼/조직 관리자여야 함 — [`src/lib/auth/dashboard-access.ts`](../src/lib/auth/dashboard-access.ts) |

**콘텐츠 퍼널(요약)**: 인지(랜딩·SEO) → 관심(가격·데모) → 결제(Toss 등) → **Library**에서 엔타이틀먼트 확인 → (향후) 다운로드/링크. 전자책 우선 전략·단계별 갭은 [`docs/CONTENT_FUNNEL.md`](../docs/CONTENT_FUNNEL.md). **읽기 허용(구독 vs 개별 구매)** 정의는 [`docs/EBOOK_READ_ALLOWLIST.md`](../docs/EBOOK_READ_ALLOWLIST.md).

장기 로드맵: 에이전트 워크스페이스, 노코드 빌더, 버티컬 데이터 루프 — North Star 문서 참고.

## Legacy: MICE (read-only narrative)

> **Deprecated for new features.** 스키마·화면는 당분간 유지.

**MICE** = **M**eetings, **I**ncentives, **C**onferences, **E**xhibitions.

| 도메인 | 레거시 개념 |
|--------|-------------|
| 행사 단위 | `events` |
| 세션 | `sessions` |
| 참가자 | `attendees` |
| 장소 | `venues` |

`event_status`, `user_role` 등은 기존 RLS·UI와 호환을 위해 유지.

## 상태 (`event_status`) — legacy

`draft` → `planning` → `registration_open` → `live` → `completed` / `cancelled`

## 역할 (`user_role`)

`admin` > `organizer` > `coordinator` > `viewer` — RLS와 UI 버튼 노출을 맞출 것.
