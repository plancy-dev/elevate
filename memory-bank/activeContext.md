# Active Context — Elevate

## 현재 페이즈

**Phase 1 — MVP · 1B (운영 CRUD)**  
**Venue CRUD** 및 이벤트의 `venue_id` 연결 완료. 다음은 **Session CRUD** (로드맵 1B-3).

## 최근 확정 결정

| 주제 | 결정 |
|------|------|
| 아키텍처 | Monolithic Next.js + Supabase (MVP), 이후 필요 시 분리 |
| 멀티테넌시 | `organizations` + `profiles.organization_id` + RLS |
| 신규 유저 조직 | 서비스 롤로 기본 조직 생성 + 프로필 `admin` (기존 `ensureDefaultOrganization`) |
| UI | Carbon 스타일 엔터프라이즈 다크, `ElevateLogo` |

## 코드베이스 앵커

| 영역 | 위치 |
|------|------|
| Supabase 클라이언트 | `src/lib/supabase/{client,server,middleware,admin}.ts` |
| 온보딩 | `src/actions/onboarding.ts` |
| 이벤트 액션 | `src/actions/events.ts` |
| 이벤트 데이터 | `src/lib/data/events.ts` |
| 인증 UI | `src/components/auth/{login,signup,forgot-password}-form.tsx` |
| 마이그레이션 | `supabase/migrations/` |

## AI / Cursor

- 작업 우선순위 단일 소스: **`memory-bank/tasks.md`**
- 워크플로우: `.cursor/rules/workflow-modes.mdc`
- 이 저장소는 **Next.js + TypeScript** 중심 — Rust 관련 규칙은 본 프로젝트에 적용하지 않음.

## 다음에 열 파일 (Session CRUD)

1. `src/app/(dashboard)/dashboard/events/[id]/` 하위 또는 상세 내 세션 편집
2. `src/actions/sessions.ts` — 서버 액션
