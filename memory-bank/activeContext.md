# Active Context — Elevate

## 현재 페이즈

**Phase 1 — MVP · 1D (진행 중)**  
`/dashboard/settings` — 조직명(`admin`/`organizer`)·프로필 표시명·`email_milestone_digest` 저장 UI·서버 액션·`005` 마이그레이션 반영됨. 원격 DB에 `005` 적용 필요.

## 최근 확정 결정

| 주제 | 결정 |
|------|------|
| 아키텍처 | Monolithic Next.js + Supabase (MVP), 이후 필요 시 분리 |
| 멀티테넌시 | `organizations` + `profiles.organization_id` + RLS |
| 신규 유저 조직 | 서비스 롤로 기본 조직 생성 + 프로필 `admin` (기존 `ensureDefaultOrganization`) |
| UI | Carbon 스타일 엔터프라이즈 다크, `ElevateLogo` |
| **Settings (CREATIVE)** | 조직명: `admin`/`organizer`만 UPDATE RLS 신설 · 프로필명: 기존 own-profile 업데이트 · 알림: `profiles` 불리언 MVP — 상세는 `memory-bank/creative-settings-org-profile.md` |

## 코드베이스 앵커

| 영역 | 위치 |
|------|------|
| Supabase 클라이언트 | `src/lib/supabase/{client,server,middleware,admin}.ts` |
| 온보딩 | `src/actions/onboarding.ts` |
| 이벤트 액션 | `src/actions/events.ts` |
| 역할·에디터 컨텍스트 | `src/lib/auth/require-org-editor.ts`, `getVenueManagerContext` |
| 설정 페이지 (현재 플레이스홀더) | `src/app/(dashboard)/dashboard/settings/page.tsx` |
| 마이그레이션 | `supabase/migrations/` — 다음 예정: `005_*` (Settings) |

## AI / Cursor

- 작업 우선순위 단일 소스: **`memory-bank/tasks.md`**
- Settings 구현 설계: **`memory-bank/creative-settings-org-profile.md`**
- 워크플로우: `.cursor/rules/workflow-modes.mdc`

## 다음에 열 파일 (Settings BUILD)

1. `memory-bank/creative-settings-org-profile.md` — RLS·정책 문구 재확인
2. `supabase/migrations/005_settings_org_update_and_profile_prefs.sql` (신규)
3. `src/actions/settings.ts` (신규) — 조직명·프로필·알림
4. `src/app/(dashboard)/dashboard/settings/page.tsx` — 폼·권한 분기
