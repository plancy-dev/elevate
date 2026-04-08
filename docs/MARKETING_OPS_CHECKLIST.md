# 마케팅·성장 운영 체크리스트 (Elevate)

배포된 사이트(`NEXT_PUBLIC_APP_URL`, 예: `https://elevate.ai.kr`) 기준으로 **직접 계정을 만들고 설정하는 작업**과 **코드/자산으로 보완할 작업**을 나눴습니다.  
SEO 기술 점검은 [`SEO_CHECKLIST.md`](./SEO_CHECKLIST.md), 콘텐츠·필라는 [`memory-bank/marketing-pillars-m2.md`](../memory-bank/marketing-pillars-m2.md)를 함께 씁니다.

---

## A. RSS / Atom 피드 — 필요한가?

| 질문 | 답 |
|------|-----|
| 검색 순위에 필수인가? | **아니요.** 구글은 RSS를 랭킹 신호로 쓰지 않습니다. |
| 그럼 왜 쓰나? | **구독자·리더(Feedly 등)·뉴스레터 연동·일부 큐레이터**가 글을 가져가기 쉽고, 브랜드가 “업데이트되는 블로그”임을 보여 줍니다. |

**구현:** [`/feed.xml`](../src/app/feed.xml/route.ts) — **기본 로케일(`en`) 블로그 글** 기준 Atom 1.0.  
다국어 전용 피드(`/ko/feed.xml` 등)는 필요해지면 같은 패턴으로 추가하면 됩니다.

**당신이 할 일:**

1. 배포 후 `https://당신도메인/feed.xml` 이 브라우저/`curl`에서 `application/atom+xml`로 열리는지 확인.
2. (선택) [Feedly](https://feedly.com) 등에 사이트 URL 또는 `feed.xml` 직접 등록해 팀이 구독.
3. (선택) 뉴스레터 도구가 RSS 입력을 지원하면 `feed.xml` URL을 연결.

루트 HTML에 `<link rel="alternate" type="application/atom+xml" href="/feed.xml" />` 는 [`layout.tsx`](../src/app/layout.tsx)의 `metadata.alternates.types`로 들어가 있습니다.

---

## B. Lighthouse·성능·코어 웹 바이탈 (배포 URL 기준)

**목표:** 검색·체감 속도·모바일 사용성 점검. “SEO” 카테고리는 메타·크롤 가능성 등 **일부**만 자동 점검합니다. 키워드 순위는 별도(검색 콘솔)입니다.

### B1. 로컬·수동 (무료)

1. Chrome → **배포 URL** 열기 → F12 → **Lighthouse** 탭.
2. 모드: **Navigation** · 범주: Performance, Accessibility, Best Practices, SEO · 디바이스: **Mobile** 한 번, **Desktop** 한 번.
3. 우선 확인할 URL 예시 (실제 라우트에 맞게 조정):
   - `/` (또는 `/ko` 등 주력 로케일)
   - `/blog`, 블로그 글 1페이지
   - `/product` 또는 `/product/prompt-studio`
4. **Performance** 점수가 낮으면: LCP 이미지·폰트·JS 번들(번들 분석은 `next build` 분석 도구 등)을 [`docs/SEO_CHECKLIST.md`](./SEO_CHECKLIST.md)의 gstack `/benchmark`와 함께 검토.

### B2. PageSpeed Insights (필드 데이터)

- [PageSpeed Insights](https://pagespeed.web.dev/)에 **공개 URL** 입력.
- **Origin** 요약이 있으면 실제 사용자(CrUX) 기준으로 Core Web Vitals를 봅니다.

### B3. 주기

- **큰 배포 후** 또는 **월 1회**: 홈 + 블로그 + 전환 페이지 1곳.

### B4. 코드로 아직 부족할 수 있는 부분 (개선 여지)

| 항목 | 상태 | 권장 |
|------|------|------|
| 기본 **OG 이미지** (`og:image`) | 루트·일부 페이지에 **전용 1200×630 이미지 없을 수 있음** | `public/`에 `og-default.png` 등 추가 후 `layout.tsx`의 `openGraph.images`에 설정. 카드 미리보기가 소셜 유입에 큼. |
| `twitter:site` | 미설정 가능 | X(트위터) 핸들 확정 후 `metadata.twitter.site` 등으로 추가. |

(이미지 파일은 디자인 확정 후 넣으면 됨.)

---

## C. 검색·색인 (계정 + 설정)

| 순서 | 플랫폼 | 당신이 할 일 |
|------|--------|-------------|
| C1 | **Google Search Console** | Google 계정으로 [GSC](https://search.google.com/search-console) 접속 → 속성 추가(도메인 또는 URL 접두어). HTML 태그 방식이면 Vercel 환경 변수 `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` 설정 후 재배포 ([`site-verification.ts`](../src/lib/seo/site-verification.ts)). |
| C2 | GSC | **사이트맵**에 `https://당신도메인/sitemap.xml` 제출. |
| C3 | GSC | 며칠 뒤 **색인 생성 요청**(중요 URL), **페이지 경험**·모바일 사용성 알림 확인. |
| C4 | **Naver 서치어드바이저** | [Naver](https://searchadvisor.naver.com/) → 사이트 등록. 메타는 이미 [`layout`](../src/app/layout.tsx) + `NEXT_PUBLIC_NAVER_SITE_VERIFICATION` 오버라이드 가능. |

### Bing Webmaster Tools — 전략적 제외 (Elevate 기준)

**결정:** Bing 전용 등록·대시보드는 **우선 쓰지 않는다.** (도메인·TLD·도구 쪽 일시 오류 등으로 수동 추가가 막히는 경우가 있음. 국내·글로벌 검색 우선순위는 **GSC + Naver**에 둔다.)

- Microsoft 검색에 일부 URL이 노출되는 것은 **크롤·링크**에 따라 자연스럽게 일어날 수 있으며, **Bing에 직접 사이트를 등록하지 않아도** 제품 개발 우선순위에서 제외 가능.
- 나중에 등록이 풀리거나 우선순위가 바뀌면 [Bing Webmaster](https://www.bing.com/webmasters)에서 **GSC 가져오기**만 시도해도 됨.

---

## D. “키워드 설정” — 메타 키워드 vs 실제 전략

- HTML `<meta name="keywords">` 는 **구글 랭킹에 거의 쓰이지 않습니다.** 루트 [`layout`](../src/app/layout.tsx)의 `keywords` 배열은 **보조적**이며, 과도한 나열은 이득이 없습니다.
- **실질적 키워드 전략**은 다음의 조합입니다.

| 방법 | 당신이 할 일 |
|------|----------------|
| **콘텐츠 클러스터** | [`marketing-pillars-m2.md`](../memory-bank/marketing-pillars-m2.md)의 P1–P5에 맞춰 블로그·랜딩 카피를 쌓기. 한 글에 하나의 주제·의도. |
| **GSC “검색어” 보고서** | 사이트 등록 후 **실제 노출·클릭된 쿼리**를 보고 제목/설명/H2를 조정 (추측보다 데이터 우선). |
| **타이틀·디스크립션** | 페이지별 `generateMetadata`·번역 JSON — **클릭률(CTR)** 최적화 문구. |
| **브랜드+카테고리** | “Elevate”, “Prompt Studio”, “프롬프트 개선” 등은 **자연스럽게** 제목·본문·내부 링크에 분산. |

PostHog는 행동 분석용이고, **검색 키워드 원본**은 GSC가 적합합니다.

---

## E. 소셜·브랜드 자산 “제로”에서 시작하기

지금 **계정·채널이 없다**는 전제로, **최소로 갖춰야 할 것**과 **순서**만 정리했다. 전부 동시에 할 필요 없음.

### E0. 먼저 손에 넣을 것 (채널과 무관)

| 항목 | 왜 | 당신이 할 일 |
|------|-----|----------------|
| **한 줄 포지셔닝** | 모든 프로필·채널 설명에 복붙 | “누구에게, 무엇을, 왜 지금” 1~2문장 (한·영 병기 권장). North Star는 [`creative-elevate-ai-pivot.md`](../memory-bank/creative-elevate-ai-pivot.md). |
| **링크 1개** | 모든 곳의 기본 URL | `https://elevate.ai.kr` (또는 캠페인 시 UTM 규칙 합의 후). |
| **로고 + 대표 색** | 아바타·썸네일 통일 | 정사각형 로고 PNG/SVG, 배너용 가로 이미지(채널별 규격은 각 플랫폼 안내 참고). |
| **기본 OG 이미지** | 링크 공유 시 빈 카드 방지 | **B4** 참고 — 1200×630 1장 제작 후 `openGraph.images` 연결. |

### E1. 추천 순서 (B2B SaaS·PLG에 맞춘 우선순위)

**1주차 — “존재 증명”만**

| 채널 | 목적 | 할 일 |
|------|------|--------|
| **LinkedIn 회사 페이지** | B2B 신뢰·채용·광고 확장 | 회사 페이지 생성 → 이름(Elevate 등)·로고·웹사이트·About 2~3문단·버튼 링크. |
| **X(트위터)** | 릴리스·블로그·짧은 소식 | 계정 생성 → @핸들 확정(나중에 바꾸기 어려움) → 프로필 URL·고정 트윗(랜딩 또는 대기명단). |

**LinkedIn만 헷갈릴 때:** [Sales Navigator](https://business.linkedin.com/sales-solutions)는 **영업용 유료 제품**, [LinkedIn Ads](https://business.linkedin.com/advertise-b)는 **광고**다. 둘 다 **회사 페이지를 만드는 화면이 아님.** 회사 페이지는 linkedin.com 로그인 후 **Create a LinkedIn Page**(무료·Company) 플로우만 쓰면 된다. 광고·Sales Nav는 **페이지가 생긴 뒤** 예산이 생기면 연결하면 된다.

**2주차 — 검색·긴 형식**

| 채널 | 목적 | 할 일 |
|------|------|--------|
| **YouTube** | 데모·튜토리얼·신뢰(“사람이 설명”) | **채널 개설만** 해도 됨: 채널 이름·설명(포지셔닝 + 사이트 링크)·프로필/배너 이미지. **첫 영상**은 “제품 60초 소개” 또는 “Prompt Studio 개념 3분” 등 1개로 시작. 재생목록: Product / Blog / Changelog 등. |
| **Google 비즈니스 프로필** | (오프라인 없으면 선택) | 제품이 완전 SaaS면 필수는 아님. |

**3주차 이후 — 팀에 맞게**

| 채널 | 메모 |
|------|------|
| **GitHub** | 오픈소스·문서 공개 시 조직명·레포 README에 사이트 링크. |
| **Instagram 피드·릴스** | 시각·라이프스타일 브랜딩이 필요할 때. B2B 도구만 다룰 땐 **Threads만** 써도 됨. |
| **Discord / Slack 커뮤니티** | 유저가 생기면 고정 메시지에 공식 URL. |

### E1a. X + Threads — 같은 소재로 2채널 써도 되나?

**가능하고, 초기엔 권장에 가깝다.** 둘 다 짧은 글·스레드형이라 **한 번 쓴 카피를 다듬어 양쪽에 올리는 방식**이면 운영 부담이 줄고, 타겟(빌더·AI 관심층)도 겹친다.

| 관점 | 팁 |
|------|-----|
| **소재** | 동일 메시지 OK. 플랫폼마다 **문장만 살짝** 다듬기(톤·줄바꿈·이모지). |
| **핸들** | X의 `@…`과 Threads 계정명이 다를 수 있음 → **각 플랫폼에 맞는 멘션**으로 수정. |
| **외부 링크** | 웨이트리스트·블로그 URL은 양쪽에 동일해도 됨. 캠페인 추적이면 `utm_source`만 `twitter` / `threads` 등으로 **구분**하면 분석이 쉬움. |
| **중복 팔로워** | 같은 사람이 둘 다 팔로우하면 비슷한 글이 연속으로 보일 수 있음 → **같은 날이면 시간 간격**을 두거나, 한쪽은 “짧은 요약본”만 올리기. |
| **인스타그램 본피드** | 스토리/릴스는 **별 크리에이티브**가 필요한 경우가 많아서, **지금은 Threads만** X와 묶어 운영해도 됨. |

### E1a2. 블로그 배포 팩 — “글만 올리지 않기”

블로그 글과 별도로 **`docs/blog/distribution/<slug>.md`** 에 **소셜 발견·전환**을 적어 둔다 ([`blog/distribution/README.md`](blog/distribution/README.md)). 한 팩 안에 다음이 들어가야 **파이프라인이 CTA까지 연결**된다.

| 포함할 것 | 이유 |
|-----------|------|
| **피라·ICP·이번 캠페인의 1차 CTA** | 글 읽기 vs 웨이트리스트 직행을 섞지 않고 의도를 고정 |
| **해시태그 3단(넓은 피드 / ICP / 브랜드)** | 관심사 피드를 쓰는 비구독자에게 노출 |
| **기사 URL + `#waitlist` URL 각각에 UTM** | PostHog·캠페인별 성과 구분 ([`docs/BLOG_POST_PIPELINE.md`](BLOG_POST_PIPELINE.md) §6, [`docs/CONTENT_FUNNEL.md`](CONTENT_FUNNEL.md)) |
| **X / Threads / LinkedIn용 별도 카피** | 플랫폼마다 훅 길이·해시태그 위치가 다름 |
| **48시간 내 후속(인용·웨이트리스트 각도)** | 한 번 올리고 끝이 아니라 “바이럴”이 아니라 **도달 반복** |

신규 글은 [`blog/distribution/_TEMPLATE.md`](blog/distribution/_TEMPLATE.md)로 복사해 시작한다.

### E1a3. Threads 커뮤니티 (예: AI Threads)

Threads에는 **주제별 커뮤니티**(베타 등)가 있고, 가입 후 글을 **해당 커뮤니티에 올리면** AI·빌더 관심층 등 **관심사가 맞는 피드**로 들어갈 수 있다. (예: **AI Threads** — 대규모 멤버·AI 주제 허브.)

| 관점 | 팁 |
|------|-----|
| **언제 쓰나** | 제품·블로그 톤이 **AI 실무·도구·프롬프트**와 맞을 때. 일반 피드만 쓸 때와 **노출·댓글 톤**이 다를 수 있으니 장기적으로 **A/B**해볼 가치가 있음. |
| **카피** | 배포 팩의 Threads 문단은 **피드·커뮤니티 겸용**으로 두고, 커뮤니티에만 올릴 때 **첫 문장만** 더 캐주얼·반전 있게 다듬는 식이 부담이 적다. |
| **UTM** | 기본은 여전히 `utm_source=threads`. **커뮤니티 출처만** PostHog에서 따로 보고 싶을 때만 `utm_content`에 **한 가지 고정 값**(예: `threads_ai_community`)을 쓰고, 같은 플래그를 여기저기 흩뿌리지 않는다 ([`.cursor/rules/posthog-integration.mdc`](../.cursor/rules/posthog-integration.mdc)). |
| **한계** | 커뮤니티 UI·노출 규칙은 Meta 쪽 변경 가능 → **채널 SoT는 여전히 자사 사이트·웨이트리스트**로 두고, 커뮤니티는 **발견·대화 레이어**로 본다. |

### E1b. Threads는 인스타 계정이 필수 — 브랜딩하려면?

**Threads 단독 가입은 없다.** Meta 정책상 [Threads](https://www.threads.net/)는 **Instagram 계정과 연동**되는 형태다. 그래서 **개인 인스타**에 묶인 Threads는 @핸들·정체성이 개인 계정을 따른다.

**회사 브랜드로 공식 Threads를 쓰려면:** **회사(제품)용 Instagram 계정**을 새로 만들고, 그 계정으로 Threads를 쓰는 편이 맞다. 인스타 피드는 **로고·한 줄 소개·링크만** 두고 비워 둬도 되고, 나중에 캐러셀·릴스를 붙이면 된다. X 핸들(`@elevate_ai_kr` 등)과 **가능하면 동일 @**로 맞추면 채널 간 인지가 쉽다.

### E1c. Instagram·Threads 기본 프로필 카피 (Elevate)

인스타 **바이오는 150자 제한**이라 X용 긴 문장은 줄여 쓴다. 아래는 **복붙용** 초안(제품 카피와 맞춤; 배포 URL은 실제 도메인으로 통일).

**Instagram**

| 필드 | 권장 내용 |
|------|-----------|
| **이름 (표시명)** | `Elevate AI` |
| **사용자 이름** | `@elevate_ai_kr` (가능할 때) |
| **바이오 (메인 초안)** | 아래 블록 A |
| **웹사이트** | **Linktree(또는 동급) 단일 URL** — 아래 § E1d. 프로필에는 긴 UTM 대신 짧은 링크만 노출. |
| **카테고리** | 소프트웨어 회사 / Technology company / Product/service 등 Meta 옵션 중 선택 |
| **프로필 사진** | X와 동일 로고(정사각형) |
| **연락처 버튼** | (선택) 이메일 또는 “문의” → 나중에 `/contact` 연결 가능 |

**바이오 블록 A (150자 이내 목표, 링크는 웹사이트 필드에 두고 바이오에는 생략 가능)**

```text
🪄 AI가 알아듣는 프롬프트를 만드는 도구, Elevate
Prompt Studio 베타 · 웨이트리스트 진행 중
✨ 프롬프트 분석 · 모델 맞춤 첨삭
```

**바이오 블록 B (더 짧게)**

```text
🪄 Elevate — 프롬프트 개선 & Prompt Studio
베타 웨이트리스트 오픈
B2B · 멀티모델 UX
```

**Threads**

- Threads 프로필 **이름·바이오**는 Instagram과 **동기화되거나 거의 같게** 보이는 경우가 많다. 앱에서 **프로필 편집**으로 문구를 맞추면 된다.
- **권장:** 인스타와 **동일한 한 줄 포지셔닝** + 웹사이트 링크(Threads는 링크 필드가 있으면 **인스타와 같은 Linktree URL**).
- X에 올리는 글과 **같은 톤**으로 스레드를 쓰면 채널 간 브랜드가 통일된다.

### E1d. 바이오 링크 허브 — Linktree (장기 전략)

**결정:** 인스타·Threads·X 프로필 등 **“링크 하나”** 자리에는 장기적으로 **[Linktree](https://linktr.ee/)** (또는 bio.link 등 동급) **한 URL**을 쓴다. 당장 버튼이 두 개뿐이어도, 나중에 웨이트리스트·블로그·문의·유튜브·릴스를 **같은 허브**에서 늘리기 쉽다.

| 항목 | 권장 |
|------|------|
| **프로필에 보이는 URL** | `linktr.ee/elevate_ai` 등 **짧은 고정 링크** (가입 후 핸들 설정). 긴 UTM은 프로필에 노출하지 않음. |
| **트래킹** | UTM은 **Linktree 안의 각 버튼 목적지 URL**에만 붙인다 (예: 웨이트리스트 `utm_medium=social&utm_source=linktree`). 분석은 링크별로 가능. |
| **초기 버튼 예시** | (1) 웹사이트 / 웨이트리스트 (2) 블로그 (3) X `@elevate_ai_kr` — 필요 시 순서만 바꿈. |
| **브랜딩** | Linktree 테마에서 로고·대표색을 Elevate와 맞추기. |
| **유튜브·링크드인** | 채널이 생기면 같은 Linktree에 버튼 추가. |

**Linktree 상단 BIO (복붙용)** — 제목이 `Elevate AI`이면 아래 중 하나만 본문에 사용.

```text
AI 프롬프트를 모델에 맞게 다듬는 Elevate · Prompt Studio 베타 웨이트리스트
```

```text
Elevate — 프롬프트 개선 & Prompt Studio
B2B · 멀티 LLM 워크플로. 웨이트리스트·블로그·소식은 아래 링크에서.
```

(선택) 영문 부제 한 줄: `Model-aware prompt improvement — Prompt Studio beta.`

**Linktree 각 링크 URL — UTM 포함 (대시보드에서 연필 아이콘으로 URL만 교체)**  
공통: `utm_source=linktree` · `utm_medium=social` · `utm_campaign` 으로 버튼 구분. 사이트 랜딩 시 PostHog/GA가 UTM을 읽도록 이미 설정돼 있으면 그대로 집계된다.

| 버튼 제목 (예시) | 붙여넣을 URL (한 줄) |
|------------------|----------------------|
| Elevate AI / Prompt Studio & waitlist | `https://elevate.ai.kr/?utm_source=linktree&utm_medium=social&utm_campaign=elevate_site` |
| Blog (추가 시) | `https://elevate.ai.kr/blog?utm_source=linktree&utm_medium=social&utm_campaign=blog` |
| Instagram | `https://www.instagram.com/elevate_ai_kr/?utm_source=linktree&utm_medium=social&utm_campaign=instagram` |
| Threads | `https://www.threads.com/@elevate_ai_kr?utm_source=linktree&utm_medium=social&utm_campaign=threads` |
| YouTube | `https://www.youtube.com/@elevate_ai_kr?utm_source=linktree&utm_medium=social&utm_campaign=youtube` |
| X (추가 시) | `https://x.com/elevate_ai_kr?utm_source=linktree&utm_medium=social&utm_campaign=x` |

- 메인 사이트는 **`http` 대신 `https`** 로 통일하는 것을 권장한다.
- 일부 SNS는 프로필 URL 뒤 쿼리를 무시하거나 줄일 수 있어도, **사이트( elevate.ai.kr ) 링크의 UTM은 반드시 유효**하다.

### E1e. “링크트리 하나로 모으면 채널 전략이 사라지나?” — 성과를 채널별로 보려면

**Linktree는 채널이 아니라 도구다.** 인스타·X·Threads·유튜브는 **각각 톤·콘텐츠·실험 단위**가 다르고, “어느 채널에서 잘 먹히는지”는 **그 플랫폼에서의 지표 + (가능하면) 사이트 유입의 출처**를 같이 본다.

| 레이어 | 무엇을 보나 | 채널별 “잘 먹힌다”에 쓰는 방법 |
|--------|-------------|-------------------------------|
| **SNS 자체** | 도달·팔로워·프로필 방문·링크 탭(가능한 플랫폼) | **채널별로 주간 스냅샷** — 같은 주에 인스타 vs X vs Threads 중 어디가 반응이 큰지. Linktree와 무관하게 **플랫폼 인사이트**가 1차다. |
| **Linktree** | 버튼별 클릭 수 | “트리 안에서 웹사이트 vs 유튜브 중 어디가 눌리나” — **허브 내부** 최적화용. |
| **사이트(PostHog 등)** | 랜딩 URL·UTM | `utm_source=linktree`만 있으면 **“트리를 거쳐 왔다”**까지. **인스타에서 트리를 열었는지 vs X에서 열었는지**까지 한 번에 남기려면 아래 조합을 쓴다. |

**채널 구분을 사이트까지 가져가고 싶을 때 (택1·병행 가능)**

1. **바이오에 넣는 Linktree URL을 채널마다 다르게**  
   예: 인스타 `https://linktr.ee/elevate_ai?utm_source=instagram&utm_medium=profile` · X는 `utm_source=twitter` · Threads는 `utm_source=threads`.  
   → Linktree가 최종 사이트 버튼으로 넘길 때 이걸 **합쳐 주는지**는 제품마다 다르므로, **실제 클릭 한 번으로 PostHog/네트워크 탭에서 확인**할 것. 안 붙으면 2번.
2. **전환 한 줄만 중요한 채널**은 한 달 실험으로 **바이오를 직링크** `https://elevate.ai.kr/?utm_source=instagram&utm_medium=social` 로 두고, 나머지는 Linktree 유지 — **채널별 직접 유입**이 찍히는지 비교.
3. **웨이트리스트/가입 폼**에 “어디서 알게 되었나요?” 1문항(선택지에 인스타/X/Threads/유튜브/기타) — Linktree 여부와 무관하게 **자기보고**로 채널 믹스를 본다.
4. **검색·직접 입력**은 Google Search Console·브랜드 검색과 별도로 본다.

**정리:** 모든 바이오를 Linktree로 통일해도 **채널별 전략은 “콘텐츠·실험 단위”로 계속 나뉜다.** “Linktree라는 하나의 채널만 관리하면 된다”가 아니라, **각 SNS는 따로 운영하고**, 성과는 **플랫폼 지표 + (선택) UTM/직링크/설문**으로 맞춘다.

### E1f. 짧은 도메인 링크 (자사) — 바이오에 UTM 문자열 안 노출

**구현:** [`next.config.ts`](../next.config.ts) 리다이렉트. **표시되는 링크는 짧게**, 서버가 홈으로 보낼 때 `utm_*` 를 붙인다.

| 경로 | 용도 | 리다이렉트 후(내부) |
|------|------|---------------------|
| `https://elevate.ai.kr/ig` | 인스타 바이오 등 | `/?utm_source=instagram&utm_medium=social&utm_campaign=bio_shortlink` |
| `https://elevate.ai.kr/x` | X 프로필 링크 | `/?utm_source=twitter&…` |
| `https://elevate.ai.kr/threads` | Threads 링크 필드 | `/?utm_source=threads&…` |
| `https://elevate.ai.kr/yt` | 유튜브 채널 “링크” 등 | `/?utm_source=youtube&…` |
| `https://elevate.ai.kr/links` | Linktree 허브 | `https://linktr.ee/elevate_ai` (외부) |

- **바이오에 넣는 문자열**만 깔끔해진다. **랜딩 후 주소창**에는 쿼리가 보일 수 있다(302 + `?utm=…`). 주소창까지 UTM 없이 쓰려면 쿠키+이벤트 방식 등 **별도 구현**이 필요하다.
- **“웹사이트” 같은 하이퍼링크 텍스트:** 인스타·X **프로필 바이오**는 보통 **URL 한 줄**만 보이고, 링크 **글자를 따로 꾸미는 기능은 없다.** “버튼 이름은 웹사이트, 주소는 숨김”은 **Linktree**에서만 가능하다. 자사 짧은 링크는 **주소 자체가 짧아 보이는 효과**에 가깝다.

**인증·제한 화면이 뜰 때:** Meta가 신규·브랜드 계정에 사람 확인을 요구할 수 있다. 안내에 따라 진행하고, **자동화 도구·가짜 팔로우**는 피하면 계정 리스크를 줄일 수 있다.

### E2. 유튜브만 따로 (시작할 때 체크)

- [ ] 채널 맞춤 URL 자격 되면 `/c/...` 또는 `@handle` 설정.
- [ ] “정보” 탭: 링크(웹사이트, X, LinkedIn 등) 최대 개수까지.
- [ ] 첫 영상 1개: 음질·자막(한/영 중 최소 한 언어) 있으면 검색·접근성에 유리.
- [ ] 블로그·랜딩에 “영상 있음”을 **내부 링크**로 연결 ([`marketing-pillars-m2.md`](../memory-bank/marketing-pillars-m2.md) P1·P2와 맞추기).

**채널 설명(어바웃) — 복붙용**  
스튜디오 **채널 사용자 지정 → 기본 정보 → 설명**에 넣는다. (길이 제한은 보통 약 1000자 — 넘으면 아래 “짧은 버전” 사용.)

**풀 버전 (한국어)**

```text
Elevate AI 공식 채널입니다.

선택한 AI 모델에 맞게 프롬프트를 분석·첨삭하는 Prompt Studio와, B2B·멀티 LLM 워크플로를 다루는 업데이트를 올립니다.

🔹 웹사이트 · 베타 웨이트리스트: https://elevate.ai.kr/yt
🔹 링크 모음 (SNS·블로그): https://elevate.ai.kr/links
🔹 X: @elevate_ai_kr

릴리스 소식·프롬프트 팁·짧은 데모는 이곳에서도 공유합니다. 구독과 알림 설정 부탁드립니다.
```

**짧은 버전 (모바일·검색 첫 줄용으로 앞부분만 쓸 때)**

```text
Elevate AI — 프롬프트 개선 & Prompt Studio. 베타 웨이트리스트: https://elevate.ai.kr/yt · 링크: https://elevate.ai.kr/links · @elevate_ai_kr
```

**영문 한 블록 (글로벌 검색·자막 톤 맞출 때, 설명 하단에 추가 가능)**

```text
Official Elevate AI channel — model-aware prompt improvement, Prompt Studio beta, and B2B AI workflow updates.
Website & waitlist: https://elevate.ai.kr/yt · Links: https://elevate.ai.kr/links · X: @elevate_ai_kr
```

### E3. 공통 규칙

- **핸들·채널 이름**은 가능한 한 플랫폼 간 통일(`@elevateai` 등 가용성 먼저 확인).
- **프로필 링크 한 줄**은 **Linktree(§ E1d)** 로 통일하고, 캠페인·채널 추적은 **Linktree 버튼별 목적지 URL**에 `utm_*` 를 붙여 Notion 등에 규칙만 고정.
- **Open Graph:** **B4** — 소셜에 링크만 던져도 미리보기가 나와야 클릭이 나온다.

---

## F. 분석·이메일·결제 (이미 있으면 스킵)

| 영역 | 확인 |
|------|------|
| **PostHog** | `NEXT_PUBLIC_POSTHOG_*` · 퍼널은 [`POSTHOG_FUNNELS.md`](./POSTHOG_FUNNELS.md). |
| **Resend / 이메일** | 대기명단 발송 도메인 DNS(SPF/DKIM) — Resend 대시보드 안내. |
| **Toss 등 결제** | 운영 키·웹훅 URL — [`tasks.md`](../memory-bank/tasks.md) 백로그 P0 참고. |

---

## G. 정기 루틴 (한 눈에)

| 주기 | 할 일 |
|------|--------|
| **배포 직후** | Lighthouse(모바일) 홈·블로그, `feed.xml`·`sitemap.xml` `curl` 확인. |
| **월 1회** | GSC 색인·검색어·크롤 오류, PSI 한 페이지. |
| **쿼터별** | [`marketing-pillars-m2.md`](../memory-bank/marketing-pillars-m2.md) 편집 캘린더 vs 실제 발행, 소셜에 블로그 1회 공유. |

---

## H. gstack 파이프라인 — “자산 제로”일 때 추천 순서

gstack에 **소셜 담당 전용 스킬은 없음.** 아래는 **목적별로 어떤 슬래시를 쓰면 되는지**만 정리했다. (저장소 규칙·`pnpm verify`는 항상 우선.)

| 단계 | 상황 | 추천 스킬 | 나오는 결과 |
|------|------|-----------|-------------|
| H1 | 채널을 다 열지 말지, 유튜브를 얼마나 할지 **우선순위가 안 서 있음** | `/office-hours` | 수요·범위·좁은 웨지 강제 질문 → 결정 메모 |
| H2 | “홈·블로그·프로필 문구가 한 톤이 아니다” | `/plan-design-review` | IA·카피·시각 계층 점수 + 개선안 (랜딩·썸네일 카피에도 응용) |
| H3 | “유튜브까지 할지 vs 블로그만 할지” **전략 갈등** | `/plan-ceo-review` (보통 **HOLD SCOPE**로 시작) | 범위 유지 vs 확장 선택 |
| H4 | Lighthouse·배포 URL **성능 회귀** | `/benchmark` | Before/After·CWV 추적 |
| H5 | 주요 플로·깨진 링크 | `/qa` 또는 `/qa-only` | 스모크 리포트 |
| H6 | 분기 끝 — **무엇을 쌓았는지** | `/retro` + PostHog·GSC 숫자 | 다음 분기 캘린더 조정 |
| H7 | 릴리스 직후 README·공개 문서와 **실제 URL** 맞추기 | `/document-release` | 문서 동기화 |

**한 줄 요약:** 먼저 **`/office-hours`** 또는 **`/plan-ceo-review`**로 “무엇을 할지”를 줄이고, 실행은 **`/plan-design-review`**로 말·눈에 맞춘 뒤, 숫자는 **PostHog + GSC**, 품질은 **`/qa`**·**`/benchmark`**.

---

## 관련 파일 (코드)

- Atom 피드: [`src/app/feed.xml/route.ts`](../src/app/feed.xml/route.ts)
- 사이트맵: [`src/app/sitemap.ts`](../src/app/sitemap.ts)
- LLM 힌트: [`src/app/llms.txt/route.ts`](../src/app/llms.txt/route.ts)
