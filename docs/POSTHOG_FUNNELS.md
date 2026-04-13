# PostHog 퍼널 — Elevate (수동 설정)

이벤트 이름·속성은 코드 [`src/lib/analytics/posthog-events.ts`](../src/lib/analytics/posthog-events.ts)에 정의되어 있습니다. 이 문서는 `NEXT_PUBLIC_POSTHOG_*`가 설정되어 있고 실제 트래픽이 들어온 뒤 **PostHog 화면에서 무엇을 만들면 되는지**만 정리합니다. **대시보드를 처음 저장하는 15분 절차(M5)**는 [`POSTHOG_DASHBOARD_FIRST_SAVE.md`](./POSTHOG_DASHBOARD_FIRST_SAVE.md)를 따른다.

**공식 문서:** [Funnels](https://posthog.com/docs/product-analytics/funnels) · [Insights](https://posthog.com/docs/product-analytics/insights).

---

## 사전 조건

1. 프로젝트에 **브라우저 이벤트**가 쌓일 것 (프로덕션 또는 실제 `phc_` 키가 들어간 스테이징).
2. **식별된 사용자** (대기명단 퍼널에는 선택): 대시보드는 [`PostHogIdentify`](../src/components/analytics/posthog-identify.tsx)로 `identify`를 호출합니다. 익명 사용자도 디바이스 ID 기준으로 person으로 잡힙니다.
3. **전환 기간:** 블로그 → 대기명단이면 기본 퍼널 전환 창 **14일**이 보통 적당합니다. “같은 세션/같은 주” 실험에 맞추려면 **24시간** 또는 **7일**로 좁혀 보세요.

---

## 퍼널 A — 블로그 읽기 → 대기명단 (PLG 핵심)

**목표:** 블로그가 마케팅 대기명단으로 실제로 이어지는지 측정합니다.

| 단계 | 유형 | 정의 |
|------|------|------|
| 1 | 커스텀 이벤트 | `elevate_blog_post_viewed` |
| 2 | 커스텀 이벤트 | `elevate_waitlist_submitted` |

**PostHog에서:** 새 인사이트 → **Funnel** → 순서대로 단계 추가 → 대시보드에 저장 (예: “Elevate PLG”).

**분해(Breakdown) 권장:**

- 1단계: `elevate_blog_post_viewed`의 속성 **`locale`** 또는 **`slug`** 기준.
- 트래픽이 쌓이면 **전체 기간**과 **최근 30일**을 비교해 보세요.

**참고:**

- 대기명단 성공 이벤트에는 이메일이 properties에 들어가지 않습니다(개인정보). PostHog에서는 **세션/사람 단위** 상관이지, 이메일 단위가 아닙니다.
- 2단계 수가 너무 적으면 API 오류 여부를 **`elevate_waitlist_submit_failed`**로 확인하세요.

---

## 퍼널 B — 홈 CTA → 대기명단

**목표:** 히어로·밴드 CTA가 대기명단 전환으로 이어지는지 봅니다.

| 단계 | 유형 | 정의 |
|------|------|------|
| 1 | 커스텀 이벤트 | `elevate_marketing_cta_click` — 필터 **`cta_id`** `=` `hero_waitlist_anchor` (또는 `band_contact`, `hero_prompt_studio`, `hero_ebooks`) |
| 2 | 커스텀 이벤트 | `elevate_waitlist_submitted` |

**`cta_id`마다 저장 인사이트를 하나씩** 만들거나, 제품이 지원하면 1단계에서 **`cta_id`로 breakdown**을 겁니다.

---

## 퍼널 C — 블로그 → 제품 관심 (보조)

| 단계 | 이벤트 | 필터 |
|------|--------|------|
| 1 | `elevate_blog_post_viewed` | 선택: `slug`에 `seo` 포함 |
| 2 | `elevate_marketing_cta_click` | `cta_id` = `hero_prompt_studio` **또는** 페이지뷰 `/product/prompt-studio` (나중에 전용 이벤트를 넣을 수 있음) |

Prompt Studio 랜딩 트래픽이 늘면 쓰면 됩니다.

---

## 퍼널 D — 로그인 후 참여 (대시보드)

**목표:** 로그인 뒤 Library / Billing 탐색을 봅니다.

| 단계 | 이벤트 |
|------|--------|
| 1 | `elevate_dashboard_identified` |
| 2 | `elevate_funnel_library_view` **또는** `elevate_funnel_billing_view` |

마케팅 블로그 퍼널과는 별도로 **조직( org )** 건강도 보기에 적합합니다.

---

## 퍼널 E — Prompt Studio → 제작 (선택)

**목표:** 스튜디오 스크래치패드에서 **Send to Productions** 로 넘어가는 흐름을 측정합니다.

| 단계 | 이벤트 | 비고 |
|------|--------|------|
| 1 | `elevate_studio_to_productions_handoff` | 속성 **`target`**: `new_episode` 또는 `existing_episode` |

인사이트에서 **Breakdown** → `target` 으로 신규 에피소드 vs 기존 에피소드 비율을 볼 수 있습니다. 이후 저장(에피소드 생성·아티팩트 추가)까지 연결하려면 제작 관련 저장 이벤트가 추가되면 같은 퍼널에 단계로 붙이면 됩니다.

### 퍼널 E — PostHog에서 인사이트·대시보드 추가 (수동)

API로 위젯을 자동 생성하지 않습니다. 아래 순서로 **한 번** 만들어 두면 됩니다.

1. PostHog → **Product analytics** → **New insight** → **Trends**.
2. **Series A**: 이벤트 `elevate_studio_to_productions_handoff` → **Total count** (또는 **Unique users**).
3. 기간: **Last 30 days** (팀에 맞게 조정).
4. (선택) **Breakdown by** → 이벤트 속성 **`target`** — 막대/둘 이상 시리즈로 `new_episode` vs `existing_episode` 비교.
5. 우측 상단 **Save** → 이름 예: `Elevate — Trend — studio → productions handoff`.
6. **Add to dashboard** → 기존 **Elevate — Marketing** 대시보드에 넣거나, 제품 전용으로 **Elevate — Product** 대시보드를 새로 만든 뒤 같은 방식으로 추가.

**확인:** Activity / Live events에서 해당 이벤트가 보인 뒤에 인사이트를 저장하면 빈 그래프 문제를 줄일 수 있습니다.

---

## 대시보드 (권장 구성)

**“Elevate — Marketing”** 대시보드 하나에 다음을 넣습니다:

1. 퍼널 A (블로그 → 대기명단)
2. 퍼널 B (CTA → 대기명단) — 필요하면 `cta_id`마다 복제
3. 트렌드: **`elevate_blog_post_viewed`** 건수 (꺾은선, 주 단위)
4. 트렌드: **`elevate_waitlist_submitted`** (주 단위)

선택: 랜딩 URL `/blog/`로 필터한 **세션 녹화**로 정성 리뷰 (프로젝트에서 켜져 있을 때).

### 저장할 때 쓸 인사이트 이름 (복사용)

Slack 링크·내보내기가 읽기 쉽도록 아래 이름을 쓰는 것을 권장합니다:

| 인사이트 | 권장 이름 |
|---------|-----------|
| 퍼널 A | `Elevate — Funnel A — blog → waitlist` |
| 퍼널 B (히어로 대기명단) | `Elevate — Funnel B — hero_waitlist_anchor → waitlist` |
| 퍼널 B (밴드 연락) | `Elevate — Funnel B — band_contact → waitlist` |
| 퍼널 B (프롬프트 스튜디오) | `Elevate — Funnel B — hero_prompt_studio → waitlist` |
| 퍼널 B (히어로 전자책) | `Elevate — Funnel B — hero_ebooks → waitlist` |
| 트렌드 블로그 조회 | `Elevate — Trend — blog_post_viewed (weekly)` |
| 트렌드 대기명단 | `Elevate — Trend — waitlist_submitted (weekly)` |
| 퍼널 D (선택) | `Elevate — Funnel D — dashboard library or billing` |
| 퍼널 E (스튜디오→제작) | `Elevate — Trend — studio → productions handoff` |

### UI 체크리스트 (순서)

1. **Activity**에서 프로덕션/스테이징에서 이벤트를 한 번씩 발생시킨 뒤 커스텀 이벤트가 보이는지 확인합니다.
2. **New insight** → **Funnel** → 퍼널 A 구성 → 위 이름으로 저장 → **Add to dashboard** → “Elevate — Marketing”.
3. 퍼널 B 변형을 `cta_id`로 1단계 필터해 반복하거나, 플랜에서 지원하면 breakdown으로 한 번에 봅니다.
4. **New insight** → **Trends** → `elevate_blog_post_viewed` → 간격 **Week** → 저장 → 대시보드에 추가.
5. `elevate_waitlist_submitted`도 동일하게 트렌드로 저장해 대시보드에 추가.
6. (선택) 팀용으로 대시보드를 고정하고, 가능하면 **Refresh**를 설정합니다.

---

## 문제 해결

| 증상 | 확인할 것 |
|------|-----------|
| **대시보드에 이벤트가 전혀 없음** (“This project has no events yet”) | 아래 **이벤트가 안 쌓일 때** 체크리스트 |
| 커스텀 이벤트가 안 보임 | 광고 차단기; Vercel의 `NEXT_PUBLIC_POSTHOG_*`; 나중에 동의 배너를 넣으면 consent 흐름 |
| 페이지뷰만 있고 커스텀은 없음 | 마케팅 레이아웃에서 [`PostHogRoot`](../src/app/layout.tsx)가 자식을 감싸는지 |
| 1단계만 100%, 2단계 0%에 가깝다 | 세션이 다름(익명 블로그 vs 식별된 대기명단) — 전환 창을 넓히기; 대기명단은 성공 시에만 발사되는지 확인 |

### 이벤트가 전혀 안 쌓일 때 (체크리스트)

1. **프로덕션에 키가 있는가** — `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` (`phc_...`) 이 **Vercel(또는 배포 환경) 환경 변수**에 들어가 있고, 넣은 뒤 **재배포**했는가. (`NEXT_PUBLIC_*` 는 **빌드 시** 번들에 박힘.) 예전에 `NEXT_PUBLIC_POSTHOG_KEY`만 쓰던 경우 **이름을 `PROJECT_TOKEN`으로 바꿔** 값을 넣는다.
2. **키가 이 프로젝트 것인가** — PostHog **Project Settings → Project API key** 의 `phc_...` 가 대시보드에서 보고 있는 **같은 프로젝트**와 일치하는가. `phx_...` 등 **브라우저 SDK용이 아닌 키**를 넣으면 수집되지 않는다.
3. **호스트 일치** — 미국 클라우드면 `NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com` (기본값과 동일). EU 프로젝트면 `https://eu.i.posthog.com`.
4. **코드 경로** — 키가 없으면 [`PostHogRoot`](../src/components/analytics/posthog-root.tsx)는 PostHog를 **아예 로드하지 않음** → 이벤트 0.
5. **브라우저** — 광고 차단·개인정보 확장 끄고 **프로덕션 URL**에서 페이지 한 번 열기 → **Activity** 또는 **Live events** 에 `$pageview` 가 뜨는지 확인.
6. **날짜 필터** — 인사이트/대시보드에서 기간을 **Last 7 days** 등으로 넓혀 보기.

---

## 관련 문서

- [`docs/CONTENT_FUNNEL.md`](./CONTENT_FUNNEL.md) — 제품 여정 + 이벤트 목록  
- [`memory-bank/marketing-content-pipeline.md`](../memory-bank/marketing-content-pipeline.md) — Phase M5
