# Elevate — Roadmap & Task Tracking (SoT)

**제품**: Elevate — MICE B2B SaaS (회의·전시·인센티브·컨퍼런스 운영)  
**스택**: Next.js 16 (App Router) · TypeScript · Tailwind v4 · Supabase (Auth + Postgres + RLS) · Vercel  
**원칙**: 멀티테넌트(`organization_id`) + RLS로 데이터 격리, 서버 컴포넌트 우선.

---

## CTO 우선순위 (한 줄)

**데이터가 있는 “운영 루프” 완성 → 팀/엔터프라이즈 → 지능/스케일**

---

## Phase 0 — Foundation (완료)

스캐폴딩, 브랜딩, 마케팅·대시보드 UI 셸, Supabase 클라이언트·미들웨어, DB 마이그레이션(멀티테넌트 + RLS).

---

## Phase 1 — MVP: “한 조직이 이벤트를 끝까지 운영”

### 1A — Auth & 데이터 파이프 (완료)

| # | 항목 | 상태 |
|---|------|------|
| 1 | Supabase Auth (이메일, OAuth 콜백, 미들웨어 세션) | ✅ |
| 2 | DB 마이그레이션 적용 (`000`→`001`→`002`) | ✅ (로컬 기준) |
| 3 | 조직 온보딩 (`ensureDefaultOrganization`, 서비스 롤) | ✅ |
| 4 | 대시보드·이벤트 목록·상세 Supabase 연동 | ✅ |
| 5 | 이벤트 생성 (`/dashboard/events/new`) | ✅ |
| 6 | 회원가입·비밀번호 재설정 UI | ✅ |

### 1B — 운영 CRUD (순서 고정)

1. **이벤트 수정·삭제** — `/dashboard/events/[id]/edit`, `updateEvent` / `deleteEvent` 서버 액션. ✅
2. **Venue CRUD** — `venues` 목록·생성·수정, 이벤트에 `venue_id` 연결. ⏳ 다음
3. **Session CRUD** — 이벤트 하위 세션 추가·수정·삭제 (상세 또는 서브라우트).
4. **비밀번호 재설정 완료** — 복구 세션 후 `updateUser` 전용 페이지(필요 시).

### 1C — 참석자 루프

1. 참석자 목록을 DB 연동 (`/dashboard/attendees`, 이벤트별 필터).
2. CSV 임포트 (서버 액션 + 검증 + 중복 정책).
3. 체크인 토글·일괄 작업.

### 1D — 설정·플랫폼 마감

1. `/dashboard/settings` — 프로필·조직명 표시/수정.
2. **Next.js `middleware` → `proxy`** 마이그레이션 (16 공식 가이드).
3. `supabase gen types` → `Database` 타입 적용.
4. Vercel 배포·프리뷰·환경 변수 점검.

---

## Phase 2 — Growth: 팀·분석·결제

| 순서 | 항목 |
|------|------|
| 1 | 조직 초대·멤버·역할 (viewer 이상 정책 정리) |
| 2 | Analytics 페이지 실데이터 집계 |
| 3 | 감사 로그 / 주요 액션 기록 (선택) |
| 4 | **Toss Payments MCP 참고** 국내 결제(티켓·플랜) PoC — 별도 ADR |
| 5 | PostHog 등 제품 분석 (이벤트 트래킹) |

---

## Phase 3 — Intelligence (백로그)

AI 인사이트, 스케줄 추천, 리포트 자동화, Concierge 챗봇 — **Phase 1 데이터·이벤트 모델이 안정된 뒤** 착수.

---

## Phase 4 — Scale (백로그)

화이트라벨, SAML/OIDC, 다국어, API 마켓플레이스, Edge·글로벌 최적화.

---

## 메모

- **서비스 롤**: 조직 자동 생성 등 관리 작업에만 사용; 클라이언트 번들 금지.
- **RLS**: `profiles.organization_id`가 없으면 데이터 접근이 막힐 수 있음 → 온보딩 필수.
- **디자인 프로토타입**: Google Stitch MCP (선택) — `mcp.json`에 키는 저장소에 넣지 말 것.
