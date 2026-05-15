# 가게점수 자영업자 Personas (V1)
**Created:** 2026-05-15 W2 D5 evening
**ADR:** ADR-028 (Indie hacker AI persona simulation principle)
**Sources:** 국세청·소상공인시장진흥공단 자영업 통계, 자영업 네이버 카페 글 패턴 분석, Threads 자영업자 post 3 patterns (2026-05-15 evening empirical), 사장님 본인 11평 카페 1년 운영 lived experience
**Disclaimer:** Hypothesis layer. PostHog real data가 ground truth. Each persona는 [verify: PostHog session N] 시점에 검증.

## Audience definition

**Target:** 1인 카페·디저트·베이커리 사장님 (한국, Seoul 수도권 dense)
**Sub-segments (secondary research):**
- 개업 6개월 미만 (early): 41% 폐업률 기간 안 — 가장 anxious
- 개업 6-18개월 (struggling): 손님 정체 + cash flow tight
- 개업 18개월+ (settled): 안정 운영 + growth 추구

## Persona 1 — 민지 (개업 6개월, 디저트 스튜디오)

**Profile:**
- 27세, 여성, 성수동
- 회사 다니다 퇴사 + 디저트 스튜디오 6개월 전 오픈
- 11평, 직원 0명, 본인 + 알바 1명 주말
- 인스타그램 follower 800명 (대부분 친구 + 친구 친구)

**Jobs to be done:**
- 손님이 더 오기를 원함 (매출 ↑)
- 인스타그램에서 발견 가능성 ↑ 시도 중 (Reels 시작했지만 못 키움)
- 카페 사장 community에서 mutual-follow + 정보 교환 적극

**Friction points:**
- "내가 안 알려서 안 오는 건지, 뭔가 다른 문제인지 모르겠어요"
- 마케팅에 시간 1일 1시간 이상 못 씀 (영업 + 디저트 만들기)
- "네이버 플레이스가 뭔지", "Google 비즈니스 프로필이 뭔지" 인지 ↓

**Threads behavior pattern:**
- hi_home_0310 같은 post에 "팔로우 했어요!" reply
- 자기 가게 사진 + "성수 디저트 좋아하시는 분 같이 키워요" post
- Helpful tip post 보면 saved 누르지만 reply는 안 함

**가게점수 reaction simulation:**

Landing visit (Step 1):
- "공개 정보로 6 영역 자동 체크" — interest ✓
- "9,900원" — fair price, conversion 가능 ↑
- "가게점수" 단어 친근감 ↑ (한국어 native)
- **Friction**: "베타라서 무료" 표현이 없어서 망설임. 9,900원도 결제 진입 망설임 (작은 카페 하루 매출 ~10만원이라 1/10 비중)

CTA Click decision:
- "30일 결과 액세스 + 1회 무료 재진단" 가치 인지 ✓
- 단 "어떤 정보를 받아가는지" 구체적 불명확 → click 망설임
- **Hypothesis: 1.82% drop은 "결과 sample preview 부재" 가능성**

Conversion potential:
- 결제 페이지 진입 가능성 30-40%
- 진단 form 완료 가능성 50-60% (5분 약속이 actual하면 가능)
- 결과 받은 후 share 의지: 인스타그램 stories에 share 가능성 30-40% ("가게점수 받았어요" mention)

**Marketing channel mode-fit (ADR-027):**
- Threads helpful tip: reach OK, conversion 약함 (saved but not click)
- Naver Blog 검색 결과: conversion ↑ (실용 정보 search 모드)
- 인스타그램 광고: 가능성 ↑ (audience targeting precise)

---

## Persona 2 — 진수 (개업 14개월, 1인 베이커리)

**Profile:**
- 35세, 남성, 망원동
- 베이커리 14개월 전 오픈
- 15평, 본인 + 시간제 알바 1명
- 매출 정체 6개월 (월 700-900만)

**Jobs to be done:**
- 매출 정체 원인 진단
- "내가 뭘 더 해야 하지" 고민 중
- 손님이 사라진 게 아니라 새 손님이 안 오는 패턴 인지

**Friction points:**
- 네이버 블로그 후기 30-50개 있음 — 인지는 됨, but conversion 안 됨
- 자영업자 forum (네이버 카페) 적극 참여 — 진단보다 동료 사장님 advice 신뢰
- "외주는 비싸고, 마케팅은 못 하고, 나는 빵만 만들 줄 알아"

**Threads behavior pattern:**
- bstory_economy 같은 trend 콘텐츠 약간 follow (general curiosity)
- 자영업 관련 카페 + 블로그 더 active
- Threads에는 가끔 자기 빵 사진 post — engagement 5-10명 (지인 위주)

**가게점수 reaction simulation:**

Landing visit:
- "공개 정보로 자동 체크" — interest ✓
- 단 "이미 네이버 블로그 후기 많아서 별로 필요할까" 망설임
- "외부 진단보다 동료 advice 신뢰" 패턴 → conversion 약함

CTA Click decision:
- 9,900원 결제 망설임 ↑ (이미 자기 시간으로 알아보는 방법 인지)
- "이것보다 자영업 카페에서 답변받는 게 더 도움될 듯"
- **Hypothesis: 1.82% drop은 이 persona가 dominant audience 중 하나 — "AI 진단보다 사람 advice 신뢰" 패턴**

Conversion potential:
- 결제 가능성 10-20%
- 단 자영업 카페에서 가게점수 답글 보면 trust signal ↑ (동료 사장님 답글 효과)
- → **Naver 카페 outreach가 이 persona에 가장 robust channel**

**Marketing channel mode-fit:**
- Threads: 거의 reach 안 됨
- Naver 카페 답글 outreach: 매우 effective
- Naver Blog 후기 (다른 자영업자의 가게점수 사용 후기): 신뢰 ↑

---

## Persona 3 — 수영 (개업 28개월, 카페+공방 복합)

**Profile:**
- 42세, 여성, 연남동
- 카페 + 도자기 공방 복합 매장 2년 4개월
- 18평, 본인 + 정규직 1명 + 알바 2명
- 매출 안정 (월 1,500만+) but growth 정체

**Jobs to be done:**
- 다음 sales channel 발견 (단골 손님 base 안정 + 새 funnel 필요)
- 브랜드 differentiation strategy
- 신메뉴 / 공방 클래스 marketing

**Friction points:**
- 마케팅 외주 검토 중 (월 100만 budget 보유)
- Instagram + 네이버 블로그 colab 시도 — ROI 측정 어려움
- "데이터 기반 마케팅" 검색 중 (가게점수 검색 가능성 ↑)

**Threads behavior pattern:**
- Threads 거의 사용 안 함 — 인스타그램 + 네이버 블로그 dominant
- LinkedIn 시작했고 (다른 사장님 + brand consultant follow)
- Helpful 콘텐츠 saving 패턴 — "다음에 진지하게 검토"

**가게점수 reaction simulation:**

Landing visit:
- "공개 정보로 6 영역 자동 체크" — strong interest
- 9,900원 — small bet, "한번 받아볼만하다"
- 단 "이미 내가 알고 있는 거 아닌가?" 의심

CTA Click decision:
- "30일 결과 + 1회 무료 재진단" 가치 인지 ✓
- "9,900원으로 6개 영역 자동 체크" + 시간 절약 (5분) 가치 합리적
- **Conversion 가능성 가장 높음 (60-70%)**

Conversion + share:
- 결과 만족 시 인스타그램에 share 가능성 ↑ (블로그 후기 publish 가능성 30-40%)
- → **이 persona가 viral seed 잠재**

**Marketing channel mode-fit:**
- 인스타그램 광고 + 네이버 블로그 SEO 둘 다 효과적
- LinkedIn helpful 콘텐츠 (founder voice)도 effective
- Threads는 거의 안 됨

---

## Persona 4 — 영호 (예비 창업자, 6개월 후 오픈 예정)

**Profile:**
- 31세, 남성, 회사 다니면서 카페 창업 준비 중
- 6개월 후 강남 또는 분당 카페 오픈 예정
- 인스타그램, 유튜브 (자영업 관련) 적극 consumption

**Jobs to be done:**
- 창업 정보 수집 + "성공 사장님 사례" 학습
- Marketing 사전 학습 ("오픈 후 즉시 손님 확보 위해")

**Friction points:**
- 시간 많음 (회사 끝나고 매일 2-3시간 자영업 정보 search)
- 정보 quality 판별 어려움 (어떤 글이 실용적, 어떤 글이 marketing 광고)
- Email 등록 + 사전 wait — 적극 OK

**가게점수 reaction simulation:**

Landing visit:
- "공개 정보로 자동 체크" — interest, but "나는 가게가 없잖아"
- **Friction: 현 사장님 target → 예비 사장 미수용**
- Naver Blog 글 "내 가게가 안 보일 때 30초 체크" → 검색 도달 ↑
- → 가게점수 진단 자체는 못 받지만 audience pool에 add

**Marketing channel mode-fit:**
- 유튜브 + 네이버 검색 + 인스타그램 광고 (창업 정보 keyword targeting)
- 가게점수 진단 형식 외에 "예비 사장님 ebook" 후보 (W4+)

---

## Persona 5 — 윤정 (45세, 부업으로 카페 운영)

**Profile:**
- 45세, 여성, 분당 (한적한 동네)
- 본업 (회사 행정) + 부업 카페 (남편이 주로 운영)
- 14평, 매출 월 400-600만 (사이드 income)

**Jobs to be done:**
- 가성비 좋은 마케팅 (시간 + 돈 둘 다 적게)
- "그냥 잘 굴러가게" 유지

**Friction points:**
- 마케팅 자체에 거부감 (그냥 단골 손님 base로 충분)
- 새로운 tool 적응 비용 ↑
- 결제 진입 망설임 (9,900원도 부담)

**가게점수 reaction simulation:**
- Landing 도달 가능성 낮음 (search behavior 약함)
- 가능성 있는 channel: 자영업 카페 답글 outreach (동료 사장님 mention)
- Conversion 5-10%

**Marketing channel mode-fit:**
- Naver 카페 답글 outreach만 effective
- 다른 channel은 reach 안 됨

---

## Persona-driven W3 simulation 결과

### Landing 1.82% Step 1→2 drop hypothesis (persona 단위 reasoning)

| Persona | Step 1→2 likelihood (simulate) | 1.82%에 contribution |
|---|---|---|
| 1 민지 (early) | 30-40% | "Sample preview 부재" — high |
| 2 진수 (struggling) | 10-20% | "AI 진단 신뢰 ↓ vs 사람 advice" — dominant friction |
| 3 수영 (settled) | 60-70% | Convert candidate — low contribution to drop |
| 4 영호 (예비) | 5% | Audience mismatch — high drop, not target |
| 5 윤정 (부업) | 5-10% | Marketing 자체 거부감 — high drop |

**Aggregate prediction:** Avg ~25% click rate among target personas (1+3). 실제 1.82%이면 → audience-persona mismatch (4,5 dominant 가능) 또는 landing-friction (preview 부재) hypothesis.

**Verify routine (W3 D1+ apply):**
- PostHog session replay (1-2 sessions) → 실제 user behavior가 어떤 persona에 가까운가
- Heatmap (scroll depth, click) → friction point empirical
- 진단 시작한 1명의 reaction trace

### 콘텐츠 form A/B test (persona simulation)

| Form | Persona 1 reaction | Persona 2 reaction | Persona 3 reaction |
|---|---|---|---|
| Threads 5/14 (founder reflection) | "재밌네" saved | "남 얘기" skip | "흥미롭지만 나에 관련 없음" save |
| Threads 5/15 (3-check tip) | "saved + 자기 체크" | "saved + 자영업 카페에 share 가능" | "applied + 가게점수 click" |
| Naver Blog long-form | reach 약함 (Threads 더 dominant) | "검색 도달 + saved + 카페 share" | "검색 도달 + 진단 click" |
| 자영업 카페 답글 | 답글 본 사람 ↓ | "동료 사장님 추천 신뢰 + click" | "검색해서 도달" |
| Instagram Reels (process 영상) | "구체적 + 이해" reach | reach 약함 | "광고로 도달 가능" |

**Strategic implication:**
- Persona 2 (struggling 자영업자, 14M old)이 가장 큰 segment 가능성 + Naver 카페 답글 mode가 가장 robust channel
- Persona 1, 3 (early + settled)는 Threads + Naver Blog SEO 가능
- Persona 4, 5 (예비, 부업)는 target에서 deprioritize

### W3 actions (persona-driven, ADR-028 적용)

| Priority | Action | Persona target |
|---|---|---|
| P1 | Persona doc commit + W3 D1 review | (this doc) |
| P2 | Landing audit (preview 부재 hypothesis fix) | 1 민지 dominant |
| P3 | Naver Blog 첫 글 publish | 2 진수 + 3 수영 |
| P4 | Naver 카페 답글 outreach (옵션, 사장님 review 후) | 2 진수 |
| P5 | PostHog session replay (실제 user persona 식별) | 모든 personas |

## Validation hypothesis

이 personas는 PostHog session replay + 1-2 actual user의 behavior로 검증 가능. 검증 시점:
- N=10 actual visitor 누적 후 (현재 14d 53명, ~2-3 weeks)
- Threads + Naver 채널 mix 후 traffic source diversification 시점

**Disagreement 시:** Real data win. Persona update.

## Out of scope

- Behavioral interview / survey (사장님 reject — manual outreach 제외)
- 자연 발생 user feedback (contact form / email)은 retain — passive layer
- Demographic 확장 (식당·서비스업 등) — Phase 2 expansion
