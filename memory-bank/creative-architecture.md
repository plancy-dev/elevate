# Creative Decision: Elevate Architecture

> **2026 product note:** The pivot centers on **content catalog / entitlements**, **Prompt Studio**, and **Studio Productions** (episodes·artifacts). The former **events → sessions → attendees** MICE tree was **removed** from Postgres (`052_drop_mice_legacy_tables.sql`). New features target the AI platform surfaces in [`creative-elevate-ai-pivot.md`](creative-elevate-ai-pivot.md).

## Decision: Application Architecture

### Option A: Monolithic Next.js + Supabase (Selected)
**장점**: 빠른 MVP 출시, 단일 배포, Vercel 최적화, 1인 개발에 적합
**단점**: 대규모 스케일링 시 서비스 분리 필요

### Option B: Microservices + Separate API
**장점**: 확장성, 독립 배포, 팀 분업
**단점**: 1인 개발 단계에서 과도한 복잡성

### Decision: Option A → MVP 후 점진적 분리

---

## Multi-Tenant Architecture

```
Organization (Tenant)
├── Profiles (Users with roles)
├── Audit / billing / integrations (as modeled in Supabase)
├── Studio productions (episodes, artifacts, distribution)
└── Content catalog & entitlements (Library, Prompt Studio gates)
```

All data access controlled via Supabase RLS policies scoped to organization_id.

---

## Database Schema

### organizations
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | 조직 ID |
| name | text | 조직명 |
| slug | text (unique) | URL 슬러그 |
| logo_url | text | 로고 |
| plan | enum | starter / professional / enterprise |

### profiles (extends Supabase Auth)
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK→auth.users) | 유저 ID |
| email | text | 이메일 |
| display_name | text | 표시명 |
| role | enum | admin / organizer / coordinator / viewer |
| organization_id | uuid (FK→organizations) | 소속 조직 |

### Historical MICE tables (removed)

The `venues`, `events`, `sessions`, `attendees`, and `session_attendees` tables plus `event_*` enums were dropped in **`052_drop_mice_legacy_tables.sql`**. Older docs referencing those columns are archived context only.

---

## Page Structure (Next.js App Router) — 실제 라우트 기준

```
app/
├── [locale]/(marketing)/   # Landing, pricing, solutions, Library marketing, …
├── (auth)/               # login, signup, forgot-password
├── (dashboard)/
│   ├── dashboard/page.tsx
│   ├── dashboard/library/, productions/, billing/, settings/, …
├── auth/callback/route.ts
├── layout.tsx, globals.css
```

Legacy `/dashboard/events|venues|attendees` paths are no longer routed; marketing redirects were removed.

세부 IA는 **`docs/design/v3-creative/toc-ia-mapping.md`** 및 North Star 문서 참고.

## Key Technical Decisions
1. **Server Components 우선**: 대시보드 데이터 페칭은 RSC로 서버에서 처리
2. **Multi-tenant RLS**: 모든 쿼리가 organization_id로 자동 스코핑
3. **Edge Functions**: 웹훅 처리, 이메일 전송, AI 분석
4. **Realtime**: Supabase Realtime (e.g. Studio video assembly job status)
5. **ISR / SSG**: Marketing and blog surfaces as configured in App Router
