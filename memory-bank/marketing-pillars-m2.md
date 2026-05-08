# M2 — 콘텐츠 필라 & 편집 캘린더 (Elevate)

**상태:** **Phase M2** (`tasks.md`)용 기획 문서입니다. **North Star:** [`creative-elevate-ai-pivot.md`](creative-elevate-ai-pivot.md).  
**분석:** [`docs/POSTHOG_FUNNELS.md`](../docs/POSTHOG_FUNNELS.md) · [`docs/CONTENT_FUNNEL.md`](../docs/CONTENT_FUNNEL.md).

---

## 로케일 (블로그 + 향후 전자책 SKU)

출시 순서: **`en`** (기본 URL) → **`ko`** → **`ja`** → **`zh-CN`** → **`zh-TW`** (리소스가 부족하면 ko/en을 먼저 병행해도 됨).  
필라 글은 결국 **모든 목표 로케일**에 두는 것이 SEO 패리티에 유리합니다. 과거 플래그십 `the-prompt-is-your-product-surface`(**en·ko·ja·zh-CN·zh-TW**)는 **2026-05-06 레포에서 제거**(운영 우선순위 조정). 현재 P1 롱폼 허브는 **`prompt-harness-beats-prompt-hacks`** (en·ko).

---

## 다섯 가지 콘텐츠 필라

| ID | 필라 | 독자·의도 | 주요 CTA | 전자책·카탈로그 연계 |
|----|------|-----------|----------|---------------------|
| **P1** | **프롬프트 작성·모델** | 프롬프트를 다듬는 실무자; “어떤 모델”, 구조, 평가 | `#waitlist`, `/product/prompt-studio` | 향후 Prompt Studio 가이드 SKU; 블로그는 **맛보기·글 하나에 패턴 하나** |
| **P2** | **가이드·디지털 러닝** | 형식을 비교하는 구매 담당; 구매 전 신뢰 | `/product/ebooks-and-guides`, Library 스토리 | **`content_products`** 전자책/가이드 행과 매핑; 블로그는 **발췌, 한 강, 목차 슬라이스** |
| **P3** | **일하는 방식의 AI (워크플로)** | 팀 리드; 엔터프라이즈 세일즈 없이 생산성 프레이밍 | Contact, `#waitlist` | 가벼운 B2B 내러티브; 나중에 **번들** SKU |
| **P4** | **신뢰·데이터·조직 맥락** | 보안을 중시하는 중소기업; 듀얼 GTM 씨앗 | Signup, Compliance/Security 페이지 | **조직 결제** 스토리 보강 |
| **P5** | **빌드 인 퍼블릭·SEO** | 개발자·얼리어답터; 투명성 | 블로그 인덱스, `#waitlist` | 메타 콘텐츠; **P1–P2로 클러스터 링크** |

**규칙:**

- 글마다 **필라 태그 하나** (front matter 또는 내부 트래커) + **CTA 하나** (버튼 다섯 개를 한 페이지에 몰지 않기).
- **전자책 규칙:** **P2**(또는 P1) 시리즈는 향후 **`content_products.slug`**와 맞는 작업 제목을 공유해 두면, M4에서 `content/ebooks/<slug>/` MDX를 나눠 붙이기 쉽습니다.

---

## 편집 리듬 (기본)

| 주기 | 담당 | 산출 |
|------|------|------|
| **주간** | 콘텐츠 | P1 또는 P2로 **블로그 조각** ≥1편 (로케일 무관) |
| **격주** | 콘텐츠 | **로케일 간** 1회 (상위 글 번역 또는 각색) |
| **월간** | PM + 콘텐츠 | PostHog 퍼널 A/B ([`POSTHOG_FUNNELS.md`](../docs/POSTHOG_FUNNELS.md)) 검토; 다음 달 믹스 조정 |

1인 팀이면: **격주에 강한 글 한 편**이 얇은 글 네 편보다 낫습니다.

---

## 분기별 캘린더 템플릿 (분기마다 복사)

`Q#`·날짜를 바꾸고 행마다 **필라**를 넣습니다. 상태: `idea` | `draft` | `scheduled` | `shipped`.

| 주 | 로케일 우선순위 | 필라 | 작업 제목·각도 | CTA | 상태 |
|----|----------------|------|----------------|-----|------|
| W1 | en + ko | P1 | | waitlist | |
| W2 | en | P2 | | ebooks / library | |
| W3 | ko | P1 | | waitlist | |
| W4 | en | P5 | 빌드 노트 / SEO | blog + waitlist | |
| W5 | ja | P2 | (번역 또는 원고) | | |
| W6 | en | P3 | | waitlist | |
| … | … | … | | | |

**전자책 열(선택):** 목표 `content_products.slug` 또는 “TBD”.

---

## Q2 2026 (4–6월) — 작업안

**기준 주:** **2026-04-06** (월)이 시작하는 주. M3 초안이 나오면 MDX front matter의 실제 배포일을 맞춥니다.  
**검토:** 월간 PostHog 퍼널 A + B ([`docs/POSTHOG_FUNNELS.md`](../docs/POSTHOG_FUNNELS.md)).

| 주 시작일 | 로케일 우선순위 | 필라 | 작업 제목·각도 | 주요 CTA | 상태 |
|-----------|----------------|------|----------------|----------|------|
| 2026-04-07 | en → ko | P1 | 블로그 첫 글: 프롬프트=제품 표면·GTM 관점 (Prompt Studio·대기명단) | `#waitlist` | **retired** (MDX 제거 2026-05-06; URL 404 예상) |
| 2026-04-13 | en | P2 | 긴 채팅 스레드보다 가이드가 나은 이유 (Library / 전자책 스토리) | `/product/ebooks-and-guides` | idea |
| 2026-04-20 | ko | P1 | 모델 고르기 전에: 작업 유형별 체크리스트 (짧은 실무 팁) | `#waitlist` | idea |
| 2026-04-27 | en | P5 | 우리가 배포한 것: 블로그 분석 + 대기명단 루프 (빌드 인 퍼블릭) | 블로그 인덱스 + `#waitlist` | idea |
| 2026-05-04 | en + ja | P2 | 발췌: 향후 가이드 SKU 목차 (본문에 placeholder 슬러그) | Library / 전자책 | idea |
| 2026-05-11 | en | P3 | 일하는 AI: 소규모 팀의 비동기 리뷰 워크플로 (엔터프라이즈 피치 없음) | `#waitlist` | idea |
| 2026-05-18 | ko | P4 | 데이터·맥락: 조직 단위로 프롬프트를 저장하는 이유 (Compliance 링크 선택) | Signup 또는 Compliance | idea |
| 2026-05-25 | en | P1 | 벤치마크 랩 없이 프롬프트 평가하기 (가벼운 루브릭) | `#waitlist` | idea |
| 2026-06-01 | en | P5 | SEO 클러스터: Q2에 나간 P1/P2 글 링크 모음 | 블로그 + `#waitlist` | idea |
| 2026-06-08 | zh-CN 또는 ko | P2 | 5월 P2 가이드 각도의 현지화 슬라이스 (번역·각색) | ebooks / library | idea |
| 2026-06-15 | en | P3 | 개인 프롬프트에서 팀 플레이북으로 (리드 프레이밍) | Contact / `#waitlist` | idea |
| 2026-06-22 | en + ko | P1 | 시즌 마무리: “베스트” 패턴 하나 + 대기명단 CTA | `#waitlist` | idea |
| 2026-06-29 | — | — | 버퍼·이월 또는 분기 회고 글 (P5) | — | idea |

---

## gstack — 언제 어떤 스킬을 쓸지

| 마일스톤 | 스킬 | 산출 |
|----------|------|------|
| 분기 시작 | `/office-hours` | North Star 대비 필라 믹스 검증 |
| 블로그 집중 스프린트 전 | `/plan-ceo-review` (HOLD SCOPE) | 과부하면 필라 축소·연기 |
| IA / CTA 배치 | `/plan-design-review` | 홈 + 블로그 글 템플릿 |
| 분기 후 | `/retro` + PostHog | 배포 대비 퍼널 지표 |

---

## 다음 단계 (인수인계)

- **M3:** 캘린더에서 **예정된 행**부터 `content/blog/<locale>/…` 아래 MDX로 출시.
- **P2** 클러스터가 유료 패키징 준비가 되면 **M4:** 카탈로그 행 + 권한 경로를 [`CONTENT_FUNNEL.md`](../docs/CONTENT_FUNNEL.md)에 맞춰 연다.

---

## 관련

- [`marketing-content-pipeline.md`](marketing-content-pipeline.md)
