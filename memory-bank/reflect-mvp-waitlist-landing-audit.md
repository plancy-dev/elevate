# REFLECT — MVP 랜딩·대기 목록·퍼널 검수 (2026-04-01)

**범위**: `ebook_waitlist_landing` 방향과 `tasks.md` Phase A/B·콘텐츠 퍼널 대비 구현 여부, 측정 가능성(PostHog·DB).

## 1. 계획 대비 구현 완료도

| 영역 | 기대 (MVP) | 상태 | 비고 |
|------|------------|------|------|
| 브랜드 / 파비콘 | 단일 마크 기반 ICO·SVG | ✅ | `scripts/generate-brand-assets.mjs`, `public/favicon.ico`, `public/icon.svg` |
| DB: 대기 목록 | `waitlist_signups`, 서버 전용 insert | ✅ | `013_waitlist_signups.sql`; RLS 켜고 정책 없음 → service role만 |
| API | `POST /api/waitlist` 검증·허니포트 | ✅ | `src/app/api/waitlist/route.ts` |
| 랜딩 | 히어로 CTA: waitlist → Prompt Studio → catalog; 대기·밴드 | ✅ | `src/app/[locale]/(marketing)/page.tsx` |
| i18n | Home/Nav/Footer/Metadata/Waitlist 등 | ✅ | `messages/*.json` — Prompt-first 정렬 |
| 내비 | Product 우선, Early access·`/#waitlist`, Catalog | ✅ | `header.tsx`, `footer.tsx` |
| 인증 카피 | 가입·로그인 = 구매·라이브러리용 (풀 데모 아님) | ✅ | `signup` / `login` 부제 |
| Product/Pricing/Demo | 과장된 “대시보드 프리뷰” 완화 | ✅ | 문자열 정리됨 |
| B2B 카탈로그·권한 | `content_products`, entitlements, Library | ✅ | 기존 Phase B |
| Toss 결제 루프 | intent / confirm / entitlement | ✅ | tasks B4·ADR 참조 |
| Prompt Studio | 플레이스홀더·로드맵 서사 | ✅ | ADR-002·대시보드 |
| **측정: 대기 목록** | DB + 분석 이벤트 | ✅ | Supabase + PostHog `elevate_waitlist_submitted` / 실패 시 `elevate_waitlist_submit_failed` |
| **측정: 마케팅 CTA** | 주요 클릭 구분 | ✅ | `elevate_marketing_cta_click` + `MarketingCtaId` |

## 2. 의도적 미구현 / 백로그

| 항목 | 설명 |
|------|------|
| PostHog 대시보드·알림 | 이벤트는 코드에 있음; 프로젝트에서 퍼널·인사이트 생성은 수동 (`tasks.md` P1). |
| 서버 전용 PostHog 캡처 | waitlist API에서 `posthog-node` 등 미사용 — 클라이언트 성공/실패 캡처로 충분; 감사만 필요하면 추가 검토. |
| 비로그인 원클릭 결제 | 전형적 B2C 전자책 퍼널과의 갭 — `CONTENT_FUNNEL.md` Known gaps. |
| 헤더/푸터 모든 링크 추적 | 홈 히어로·밴드 주요 CTA만 `MarketingTracked*`; 나머지는 페이지뷰·자동 캡처에 의존 가능. |
| `pnpm db:types` | 원격/로컬 DB 반영 후 실행 (`tasks.md` B3). |

## 3. 사용자 반응을 보기 위한 구조 (요약)

1. **데이터**: `waitlist_signups`에 이메일·locale·source 저장 — 운영·내보내기·후속 캠페인.
2. **제품 분석**: PostHog에서 `elevate_waitlist_submitted` 수, `source`/`locale` 분해, `elevate_marketing_cta_click`의 `cta_id`로 히어로 vs 밴드 전환 비교.
3. **앱 퍼널** (기존): `elevate_funnel_library_view` 등 — 로그인 후 Library/Billing/구매/다운로드.

상세 이벤트·스키마: [`docs/CONTENT_FUNNEL.md`](../docs/CONTENT_FUNNEL.md), [`src/lib/analytics/posthog-events.ts`](../src/lib/analytics/posthog-events.ts).

## 4. 결론

MVP로 합의했던 **전자책·뉴스레터(대기)·랜딩 재프레이밍·Supabase·API·측정 훅**은 구현되어 검증 가능한 상태다. 남은 것은 **PostHog에서 퍼널·대시보드 구성**, **운영 키·웹훅**, **카탈로그/스토리지 옵스** 등 운영·성장 과제다.

## 5. 2026 Q2 — Prompt-first 랜딩 재정렬

랜딩·메타·내비·i18n을 **Elevate AI / 프롬프트 개선(MVP)·Prompt Studio** 중심으로 재정렬했다. **대기 명단**은 Prompt Studio 베타 **화이트리스트**로 프레이밍하고, **전자책·카탈로그**는 성장·보상·상업 레이어로 두었다. **블로그·뉴스레터·SEO**는 유입 채널로 `docs/CONTENT_FUNNEL.md`에 반영했다. 히어로 CTA 순서: waitlist → Prompt Studio → catalog (`MarketingCtaId.HERO_PROMPT_STUDIO` 추가).
