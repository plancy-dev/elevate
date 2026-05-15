# ADR-027 — Channel strategy by audience purpose (helpful vs promote vs discover)

**Status:** Draft (2026-05-15 W2 D5 evening, ready for W3 D1 review)
**Context:** W2 D4 Threads 96/0 + W2 D5 evening 가게점수 Threads feed empirical review (3 post 패턴 분석)
**Related:** ADR-024 (founder framing, Studio scope), ADR-022 (가게점수 Level 1 manual concierge)

## Background

W2 D4 가게점수 Threads post (founder reflection + funnel data) → 96 views / 0 engagement. W2 D5 evening 사장님이 같은 Threads feed의 다른 자영업자 post 3개 share. 패턴 분석 결과:

- **hi_home_0310 (병아리 카페):** "릴스 같이 키워볼 친구 있어? 인팔/스팔/맞팔" — mutual-follow 요청
- **theronicake (화성 봉담):** "케이크 생각나면 우리 가게 떠올랐으면" — self-promote
- **bstory_economy:** AI 콘텐츠 — 자영업 외 mix

3 post 공통 패턴: **자영업자가 Threads에서 하는 행동은 (a) self-promote, (b) mutual-follow 요청, (c) 외 무관한 콘텐츠**. **Helpful tip 콘텐츠는 거의 없고 reply도 적음.**

## Decision

**Channel은 audience purpose에 따라 분류한다 (single audience가 multiple channel에 있을 때, channel별로 다른 purpose mode 가짐).**

### Audience purpose mode 3 분류

**Mode 1 — Promote channel (자기 share + community visibility 우선)**
- 사용자가 channel 사용 이유: 자기 brand/product/identity 노출 + mutual support
- Helpful 콘텐츠 reach OK이지만 conversion (click + action) 약함
- 적합 콘텐츠: 자영업자가 share할 만한 콘텐츠 (자기 가게 진단 결과, 자기 funnel data 등 — 자기 promote effect 있음)
- 예: Threads (자영업자 mode), Instagram Reels (자영업자 mode), LinkedIn (founder mode)

**Mode 2 — Helpful audience channel (정보 소비 + saved/applied 우선)**
- 사용자가 channel 사용 이유: 실용 정보 + 해결책 찾기
- Helpful 콘텐츠 reach + conversion 둘 다 OK
- 적합 콘텐츠: tip + how-to + 실용 체크리스트
- 예: Naver Blog (자영업자 검색 mode), 자영업 네이버 카페 (정보 교환 mode), YouTube (학습 mode)

**Mode 3 — Discover channel (발견 + search-driven 우선)**
- 사용자가 channel 사용 이유: 특정 problem 해결 search 결과 발견
- 적합 콘텐츠: SEO-optimized landing + decision-grade content
- 예: Naver SEO, Google search, AppStore search

### 가게점수 channel mapping

| Channel | 자영업자 purpose mode | 적합 콘텐츠 | 현재 진행 |
|---|---|---|---|
| Threads | Promote (mostly) | 자영업자가 share할 진단 결과 / funnel data | 5/14, 5/15 post — pivot 중 |
| Instagram Reels | Promote | 가게점수 진단 process 영상 | 미진행 |
| Naver Blog | Helpful + Discover | 실용 tip + SEO + 키워드 ranking | 미진행 ⭐ |
| Naver 카페 (자영업) | Helpful | 진단 결과 sharing + 도움글 답글 | 미진행 ⭐ |
| Naver Search | Discover | "내 가게 검색 안 보일 때" landing | 미진행 ⭐ |
| Instagram (post) | Promote | 가게점수 service intro | 미진행 |
| Google Search | Discover (외국인 손님) | Google Maps + Local SEO | 미진행 |

### Elevate (Studio brand) channel mapping

| Channel | Builder purpose mode | 적합 콘텐츠 | 현재 진행 |
|---|---|---|---|
| Twitter/X | Helpful + Promote mix | Founder reflection (ADR-024) + funnel data | 미진행 ⭐ |
| LinkedIn long-form | Promote (enterprise audience) | Studio brand essays | 미진행 |
| Indie Hackers | Helpful | Vertical product build doc | 미진행 |
| Hacker News submission | Discover (PMF post 시) | Essay submission | 미진행 |
| Substack/own blog | Helpful + own audience | Essays + Dispatch | ✅ Essays publish 진행, Dispatch infra W3+ |
| 한국 IT 커뮤니티 | Helpful | Korean 번역 essay | 미진행 |

## Routine — channel 선택 시 의사결정

새 콘텐츠 생성 또는 publish 결정 시:
1. **Audience purpose mode 식별:** 이 channel에서 이 audience는 어떤 행동을 하는가?
2. **콘텐츠 mode-fit 확인:** 콘텐츠가 channel mode와 일치하는가?
3. **Mode mismatch 시 옵션:** (a) 콘텐츠 mode 변경 (b) channel 변경

## Implications (즉시 적용)

### 가게점수 channel pivot 권장 (W3+)

W2 D5까지 Threads single channel test. 결과 기반:

**Success (engagement ≥ 3):** Threads 정기 publish 유지 + 콘텐츠 form: 자영업자가 share할 만한 자기 진단 결과 / before-after 사례
**Failure (engagement 0):** Threads 보조 + main pivot:
- **Naver Blog** (mode 2 helpful + mode 3 discover) — 가장 robust
- **자영업 네이버 카페** (mode 2 helpful) — 답글 위주, conversion-friendly

### Elevate channel 선택 (W3 D1+)

Essays publish 후 distribution:
- **Twitter/X** (mode 1+2 mix) — founder reflection 적합. Builder audience direct.
- **LinkedIn** (mode 1 enterprise) — long-form repost.
- **Indie Hackers** (mode 2 helpful) — essay submission, comment 활발.
- **Hacker News** (mode 3 discover) — significant essay만, spike potential.

## Out of scope

- Multi-account strategy — W4+
- Paid acquisition — PMF 후 W5+
- Influencer/partnership outreach — 별도 ADR

## Empirical trigger

- W2 D4 Threads founder reflection 96/0 (가게점수)
- W2 D5 Threads feed empirical pattern (자영업자 3 post)

## References

- ADR-024 founder framing
- ADR-022 가게점수 Level 1 manual concierge
- `docs/anti-patterns-w2-d4-d5.md` #31 (Threads audience mismatch)
- 가게점수 Threads account empirical observation 2026-05-15 evening
