# Domain Knowledge — Elevate AI Platform

**North Star**: [`creative-elevate-ai-pivot.md`](creative-elevate-ai-pivot.md)

## Current product concepts (pivot)

| 도메인 | 제품 개념 |
|--------|-----------|
| 조직 | `organizations` — 멀티테넌트, 플랜·결제·권한의 루트 |
| 프로필 | `profiles` — Auth 연동, 역할, `organization_id` |
| 콘텐츠 카탈로그 | `content_products` — 판매 단위 메타데이터; **`product_kind`**: `ebook`(기본) → `guide` / `template` / `bundle` |
| 권한(엔타이틀먼트) | `organization_content_entitlements` — 조직이 어떤 콘텐츠에 접근하는지 |
| 대시보드 셸 접근 | `profiles.dashboard_access === true` (조직 `role`과 무관) — [`src/lib/auth/dashboard-access.ts`](../src/lib/auth/dashboard-access.ts) |

**콘텐츠 퍼널(요약)**: 인지(랜딩·SEO) → 관심(가격·데모) → 결제(Lemon Squeezy 등) → **Library**에서 엔타이틀먼트 확인 → (향후) 다운로드/링크. 전자책 우선 전략·단계별 갭은 [`docs/CONTENT_FUNNEL.md`](../docs/CONTENT_FUNNEL.md). **읽기 허용(구독 vs 개별 구매)** 정의는 [`docs/EBOOK_READ_ALLOWLIST.md`](../docs/EBOOK_READ_ALLOWLIST.md).

장기 로드맵: 에이전트 워크스페이스, 노코드 빌더, 버티컬 데이터 루프 — North Star 문서 참고.

## Historical MICE domain (removed)

예전 **events / sessions / attendees / venues** 및 관련 enum(`event_type`, `event_status`, `registration_type`)은 **`052_drop_mice_legacy_tables.sql`** 로 스키마에서 삭제됨 (프로덕 적용 전 백업·영향 검토 필수). 새 기능은 AI 피벗 도메인만 대상으로 한다.

## 역할 (`user_role`)

`admin` > `organizer` > `coordinator` > `viewer` — RLS와 UI 버튼 노출을 맞출 것.
