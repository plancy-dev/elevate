# Creative Decision: Elevate Architecture

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
├── Venues
├── Events
│   ├── Sessions
│   └── Attendees
│       └── Session Attendees
└── (Future: Billing, Integrations)
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

### events
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | 이벤트 ID |
| organization_id | uuid (FK) | 소속 조직 |
| title | text | 이벤트명 |
| slug | text | URL (org 내 unique) |
| event_type | enum | conference / exhibition / meeting / ... |
| status | enum | draft / planning / live / completed / ... |
| venue_id | uuid (FK) | 장소 |
| start_date / end_date | timestamptz | 기간 |
| expected_attendees | int | 예상 참석자 수 |
| actual_attendees | int | 실제 참석자 수 |
| budget_cents | bigint | 예산 (센트) |
| revenue_cents | bigint | 매출 (센트) |

### sessions
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | 세션 ID |
| event_id | uuid (FK) | 이벤트 |
| title | text | 세션명 |
| speaker_name | text | 발표자 |
| room | text | 장소 |
| start_time / end_time | timestamptz | 시간 |
| capacity | int | 정원 |
| registered_count | int | 등록 수 |

### attendees
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | 참석자 ID |
| event_id | uuid (FK) | 이벤트 |
| email | text | 이메일 (이벤트 내 unique) |
| first_name / last_name | text | 성명 |
| company / job_title | text | 소속 |
| registration_type | enum | general / vip / speaker / sponsor / media |
| checked_in | bool | 체크인 여부 |
| ticket_price_cents | int | 티켓 가격 |
| nps_score | smallint | NPS (0-10) |
| custom_fields | jsonb | 사용자 정의 필드 |

---

## Page Structure (Next.js App Router) — 실제 라우트 기준

```
app/
├── (marketing)/          # 랜딩, pricing, contact, product, solutions, …
├── (auth)/               # login, signup, forgot-password
├── (dashboard)/
│   ├── dashboard/page.tsx
│   ├── dashboard/events/page.tsx
│   ├── dashboard/events/new/page.tsx
│   ├── dashboard/events/[id]/page.tsx
│   ├── dashboard/events/[id]/edit/page.tsx   # 이벤트 편집
│   ├── dashboard/attendees|venues|analytics|settings|help/…
├── auth/callback/route.ts
├── layout.tsx, globals.css
```

세션·참석자 **전용 서브경로**는 필요 시 추가; 현재는 이벤트 상세·글로벌 attendees 화면으로 단계적 연동.

## Key Technical Decisions
1. **Server Components 우선**: 대시보드 데이터 페칭은 RSC로 서버에서 처리
2. **Multi-tenant RLS**: 모든 쿼리가 organization_id로 자동 스코핑
3. **Edge Functions**: 웹훅 처리, 이메일 전송, AI 분석
4. **Realtime**: Supabase Realtime으로 실시간 체크인 대시보드
5. **ISR**: 공개 이벤트 페이지는 Incremental Static Regeneration
