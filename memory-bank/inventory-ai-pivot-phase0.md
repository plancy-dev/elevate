# Phase 0 — AI 피벗 기준선 인벤토리

생성일: 2026-04-01. MICE → AI 가이드 피벗 계획의 갭 분석용.

## 1. 마이그레이션·엔티티

| 파일 | 요약 |
|------|------|
| `000_pre_init_cleanup.sql` | 사전 정리 |
| `001_initial_schema.sql` | **MICE**: `organizations`, `profiles`, `venues`, `events`, `sessions`, `attendees`, `session_attendees` + RLS |
| `002_profiles_select_own.sql` | profiles RLS |
| `003_session_attendees_policies.sql` | 세션 참석 RLS |
| `004_profiles_rls_no_recursion.sql` | profiles RLS |
| `005_settings_org_update_and_profile_prefs.sql` | 설정·프로필 |
| `006_organization_invitations.sql` | 팀 초대 |
| `007_audit_logs.sql` | 감사 로그 |
| `008_toss_payment_intents.sql` | 결제 인텐트 |

**재사용**: Auth, `organizations`, `profiles`, 초대·감사·결제 인프라.  
**피벗 후 방침**: MICE 테이블은 당분간 **보관**(삭제 마이그레이션 보류). 신규 도메인은 별도 테이블로 추가.

## 2. 앱 라우트 (요약)

| 영역 | 경로 패턴 |
|------|-----------|
| 마케팅 | `src/app/[locale]/(marketing)/` — 홈, product, solutions, pricing, about, blog, … |
| 인증 | `src/app/(auth)/` — login, signup, forgot-password |
| 대시보드 | `src/app/(dashboard)/dashboard/` — events, venues, attendees, analytics, team, billing, audit, settings, help |

## 3. 문서·SoT

| 파일 | 피벗 시 조치 |
|------|----------------|
| `README.md` | MICE → AI 제품 서사로 갱신 |
| `memory-bank/domainKnowledge.md` | MICE 용어 → AI/플랫폼 용어 |
| `memory-bank/tasks.md` | Phase를 AI 피벗 마일스톤으로 재작성 |
| `docs/adr/*` | MICE 전용 ADR은 유지하되 상단에 “legacy / MICE” 맥락 |

## 4. North Star 단일 문서

→ [`creative-elevate-ai-pivot.md`](creative-elevate-ai-pivot.md)
