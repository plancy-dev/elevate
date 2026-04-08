# SEO 점검 체크리스트 (Elevate)

Next.js App Router 기준으로 **기술 SEO**와 **등록·측정**을 나눠 정리합니다. gstack에는 “SEO 전용” 스킬이 없으므로, 아래 **역할 매핑**으로 같은 목적을 커버합니다.

---

## 1. 사이트맵·robots (기술)

| 항목 | 코드·경로 | 확인 방법 |
|------|-----------|-----------|
| 사이트맵 | [`src/app/sitemap.ts`](../src/app/sitemap.ts) | `curl -sI https://elevate.ai.kr/sitemap.xml` → `content-type: application/xml` (또는 `text/xml`). 본문은 `<?xml` 로 시작해야 함. |
| robots | [`src/app/robots.ts`](../src/app/robots.ts) | `/robots.txt`에 `Sitemap: https://elevate.ai.kr/sitemap.xml` 포함 |
| 다국어 | [`src/lib/seo/locale-alternates.ts`](../src/lib/seo/locale-alternates.ts) | 사이트맵에 `<xhtml:link rel="alternate" hreflang="…" />` 포함 |

**브라우저에서 “한 덩어리 텍스트”처럼 보일 때:**  
서버 응답은 위 `curl`으로 검증하는 것이 정확합니다. 일부 브라우저·뷰에서는 XML을 접거나 한 줄로만 보여 **태그가 없어 보이는** 착시가 날 수 있습니다. 크롤러는 **응답 본문·`Content-Type`** 기준으로 판단합니다.

---

## 2. 소유권·색인 등록 (운영)

| 채널 | 설정 |
|------|------|
| **Google Search Console** | 도메인 또는 URL 접두어 속성 추가 → **HTML 태그** 방식이면 Vercel에 `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` 설정 ([`site-verification.ts`](../src/lib/seo/site-verification.ts) · 루트 `layout` metadata). |
| **Naver 서치어드바이저** | 기본값/오버라이드: `NEXT_PUBLIC_NAVER_SITE_VERIFICATION` ([`site-verification.ts`](../src/lib/seo/site-verification.ts)). |
| **사이트맵 제출** | GSC·Naver에서 `https://elevate.ai.kr/sitemap.xml` 제출. |
| **canonical·hreflang** | 마케팅·블로그는 `generateMetadata`에서 처리 ([예: 블로그 글](../src/app/[locale]/(marketing)/blog/[slug]/page.tsx)). |

`NEXT_PUBLIC_APP_URL`은 **공개 origin**과 일치해야 합니다 (메타·사이트맵·OAuth와 동일). [`getSiteUrl()`](../src/lib/seo/site-url.ts) 참고.

---

## 3. 페이지·구조화 데이터

| 항목 | 위치 |
|------|------|
| 기본 메타 | [`src/app/layout.tsx`](../src/app/layout.tsx) — `metadataBase`, `title`, `description`, OG |
| 로케일별 마케팅 | `[locale]/(marketing)/…` 각 `generateMetadata` |
| JSON-LD | [`MarketingSiteJsonLd`](../src/components/seo/marketing-site-jsonld.tsx) |
| LLM 힌트 | [`/llms.txt`](../src/app/llms.txt/route.ts) |

---

## 4. gstack으로 SEO 인접 작업 나누기

gstack에 **“마케팅 담당자 전용”이나 “SEO 전문가” 역할 스킬은 없습니다.** 대신 아래처럼 **목적에 맞는 스킬**을 쓰면 같은 파이프라인을 재현할 수 있습니다.

| 목적 | 추천 스킬 | 비고 |
|------|-----------|------|
| 랜딩·블로그 **IA·카피·시각 계층** 점검 | `/plan-design-review` | UI/UX·정보 구조 (검색 스니펫에 좋은 제목/설명 구조와 맞물림). |
| **Core Web Vitals·속도** | `/benchmark` | SEO의 기술 요소 중 성능·LCP 등. |
| **깨진 링크·폼·주요 플로** 스모크 | `/qa` 또는 `/qa-only` | 크롤/사용자 관점 품질. |
| 출시 후 **문서·README와 실제 배포 동기화** | `/document-release` | 공개 URL·메타 설명이 문서와 어긋나지 않게. |
| 전략·우선순위 논의 | `/office-hours`, `/plan-ceo-review` | 콘텐츠·GTM과 연계 시. |

**저장소 규칙 우선:** `AGENTS.md`, `pnpm verify`, 커밋 훅은 gstack 스킬보다 우선합니다 ([`docs/AI_ORCHESTRATION.md`](./AI_ORCHESTRATION.md)).

---

## 5. 주기적 재검증 (짧게)

1. `curl -sI`로 `sitemap.xml`·`robots.txt` 상태 코드·`Content-Type`.
2. GSC **페이지 색인**·사이트맵 오류 (주 1회면 충분한 경우 많음).
3. 큰 배포 후: 홈·블로그 1페이지 **소스 보기**로 `canonical`·`hreflang`·JSON-LD 존재 확인.

---

## 관련 문서

- [`docs/CONTENT_FUNNEL.md`](./CONTENT_FUNNEL.md) — 제품·마케팅 여정
- [`docs/MARKETING_OPS_CHECKLIST.md`](./MARKETING_OPS_CHECKLIST.md) — RSS·Lighthouse·검색 콘솔·키워드·소셜·운영 루틴 (상세)
- [`memory-bank/marketing-pillars-m2.md`](../memory-bank/marketing-pillars-m2.md) — 콘텐츠·SEO 클러스터 기획
