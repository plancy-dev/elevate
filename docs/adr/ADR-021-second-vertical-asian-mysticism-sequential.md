# ADR-021: Second vertical = Asian mysticism (AI 사주), sequential phasing

**Date**: 2026-05-13
**Status**: Accepted
**Layer**: Studio (umbrella thesis decision)
**Related**: ADR-014 (Elevate Studio brand), ADR-019 (가게점수 layered product), ADR-020 (aggregator/tool-builder framing)

## Context

Elevate Studio의 underlying thesis는 "aggregator/curator of public data + AI delivery, replicable across verticals" (ADR-020 framing의 generalization). 가게점수가 first vertical로 launched, Korean 자영업자 visibility 진단 tool. 6일 baseline에서 cold account algorithm floor (40 조회 / 0 외부 engagement / 0 결제) empirically 확인됨.

W2 D3 sprint에 founder가 second vertical direction question raised. Founder thesis:
- "인간의 욕망을 자극해서 돈을 버는 글로벌 서비스"
- AI 사주 / 점복 candidate
- 일본 / 중국 priority (한국은 incumbent dense)

Empirical research Round 1 findings (Drive: 2026-05-13-second-vertical-research-round-1.md):
- 일본 점복 시장 규모: ¥997억엔 (狭義) / ¥1조엔 (広義)
- Global astrology app market: $5.69B (2026) → $29.82B (2033, CAGR 24.93%)
- Freemium 45% market share dominant, ARPU $8-22/month subscription
- 일본 reality: "AI보다 *생의 *인간"이 *premium → AI commodity + human consultation referral hybrid
- Asian blue ocean: Western 별자리 apps (Co-Star, The Pattern) vs Asian 점복 (BaZi 사주) direct competition 안 함

진짜 strategic question: 가게점수 vs Second vertical resource allocation, sequencing, focus management.

## Decision

**Modified Sequential approach with parallel empirical research**:

### Phase 1 (현재 ~ W6, 4-6 weeks)
- 가게점수: Primary execution focus
  - Threads cumulative posting (5-7 posts buildup until algorithm trigger)
  - Polar conversion empirical measurement
  - Hero K body production deploy ✅ (2026-05-13)
  - OG meta + opengraph-image ✅ (2026-05-12)
- Second vertical: Parallel empirical research only (1-2시간/week max)
  - 일본 점복 app market study (LINE Fortune, ZAVAS 등 top 5)
  - 대만 / 중국 점복 market sizing
  - Co-Star, The Pattern Western reference study
  - Asian fortune-telling traditions cross-reference (BaZi, 사주, 손금, 관상, 별자리)
  - Drive에 findings cumulative capture (Elevate Studio/Research/)

### Phase 2 (W6 ~ W10, 4 weeks)
- 가게점수: Signal evaluation
  - PMF achieved → maintain + scale
  - PMF unclear → pivot 또는 maintain at lower priority
  - PMF fail → deprioritize (shutdown 후순위)
- Second vertical: MVP scope final decision
  - Phase 1 empirical findings 기반
  - 브랜드 이름 결정
  - ADR-022 (가능성): Second vertical product specification

### Phase 3 (W10 ~ W14, 4 weeks)
- Second vertical: Lean MVP build
  - 새 repo 생성 (브랜드 이름 기반)
  - Next.js 16 + Pretendard + Noto Sans JP + Polar (JPY billing)
  - Single page (사주 generator + email subscription)
  - 일본어 first, 한국어 fallback
  - Threads / Instagram organic content seed
  - Free tier 3개월 + premium pre-order
- 가게점수: Maintain (또는 Phase 2 outcome 따라 deprioritize)

### Phase 4 (W14+, ongoing)
- Empirical signal measurement
- Iterate / Expand / Pivot decision data-based

## Rationale

1. **Empirical premature decision 회피**: 가게점수 6-day baseline은 premature. 최소 2-4 weeks cumulative posts 필요 (algorithm trigger 분기점, anti-pattern catalog #20 reference).

2. **Founder cognitive bandwidth**: 1-person team에서 concurrent execution은 둘 다 quality 떨어짐. Sequential focus가 quality preserve.

3. **Sunk cost 보호**: 가게점수 W2 launch infrastructure (Hero K body, OG meta, ADR-019, ADR-020) 보존. 빠른 pivot은 sunk cost 손실.

4. **Strategic optionality**: Empirical research가 parallel cheap이므로 진행하되, MVP build는 가게점수 signal 결정 후 commitment.

5. **Risk diversification**: Sequential phasing이 catastrophic failure risk (둘 다 동시 fail) 회피.

6. **Elevate framework replicability validation**: 가게점수에서 ADR-020 aggregator framing 검증되면 Second vertical에 same framework 적용으로 validation reuse.

7. **Multi-language infrastructure activation**: 가게점수는 Korean-only이라 Elevate Studio i18n Phase 1-5 활용 0. Second vertical (일본 + 대만 + 한국)가 i18n infrastructure first user.

## Target market priority (Phase 3 launch)

1. **일본 (primary)**: ¥997억엔 mobile uranai market, premium pricing acceptable (¥500-2,000/month)
2. **대만 (beachhead)**: China access 준비, 繁體中文 ZH localization start, regulatory freer than China mainland
3. **한국 (sister-vertical co-habit)**: 가게점수 sibling brand 가능. Deprioritized launch (사장님 표현 + competitive density)
4. **중국 본토 (future)**: 대만 validation 후 진입. Regulatory risk 큼 — entertainment/cultural heritage framing 필수.

## Product type priority

1. **사주 (BaZi) — Daily companion**: Tier 1 entry
   - Deepest Asian tradition + multi-language reusable algorithm
   - Daily push = highest engagement → fastest empirical signal
   - Subscription revenue model natural
2. **궁합 (Compatibility)**: Tier 2 entry (impulse purchase + gift-able)
3. **연간 운세 (Annual outlook)**: Tier 3 (premium)
4. **손금 / 관상**: 후속 expansion
5. **별자리 (Astrology)**: Western differentiation (사주 contrast로)

## Monetization framework (Round 1 empirical 기반)

- **Tier 1 (free)**: Daily AI 사주 push, lucky color/number, basic insight
- **Tier 2 (¥500-1,000/month subscription)**: Personalized deep BaZi + compatibility reports
- **Tier 3 (¥2,990 one-time)**: Annual outlook deep report
- **Tier 4 (marketplace, 후속)**: Human consultant referral, per-minute fee revenue share

→ Co-Star freemium subscription pattern + AstroTalk consultation marketplace hybrid.

## Consequences

### Positive
- 가게점수 launch invested work 보호
- Founder cognitive focus 유지 (single-vertical primary execution)
- Second vertical empirical research가 risk-free parallel (low cost, high optionality value)
- ADR-020 framework reuse 검증 가능
- Elevate Studio i18n infrastructure activation path
- Multi-vertical Elevate Studio thesis validation
- Catastrophic failure risk diversification

### Negative
- Second vertical launch가 W10-W14로 지연 (가게점수 6-month validation 시점)
- 일본 competitive landscape이 W14+에는 더 dense 가능 (premature → reactive 전환)
- 가게점수 PMF fail 시 Phase 2 pivot 시점이 second vertical commitment 늦춤

### Neutral / 후속 work
- 브랜드 separation 결정: 가게점수 vs Second vertical brand cognitive distance 큼 (mysticism brand는 playful + premium + Asian aesthetic, 가게점수는 tool builder narrative). 별도 brand 권고.
- ADR-022 (Phase 2): Second vertical product specification
- ADR-014 amend 가능: Multi-vertical Elevate Studio thesis explicit

## Implementation — Phase 1 immediate actions (W2 D3 ~ W6)

### 가게점수 primary execution
- 5/13 19시 Option C post publish ✅ (예약 완료)
- 5/14 morning: 카카오맵 영업시간 단일 영역 deep dive
- 5/14 evening: 인스타 지역 태그 부재
- 5/15 morning: 구글/네이버/카카오 영업시간 불일치
- 5/15 evening: 가게 사진 첫인상
- 5/16 morning: 정보 일관성
- 5/16 evening (옵션): AI prompt direction first test (메뉴 사진 photoshoot)
- W3+: cumulative posting + measurement framework

### Second vertical parallel research
- 일본 점복 app top 5 brief study ✅ Round 1 진행됨
- Co-Star, The Pattern 매출 모델 study ✅ Round 1
- BaZi / 사주 algorithm public reference 수집 (Round 2)
- 대만 시장 entry barriers research (Round 2)
- 중국 regulatory situation (Round 2)
- LINE Fortune business model breakdown (Round 2)
- Drive Elevate Studio/Research/ folder 활용 ✅ 생성됨

## Reference

- ADR-014: Elevate Studio brand (umbrella thesis)
- ADR-019: 가게점수 layered product (Stage 1 visibility + Stage 2 cost)
- ADR-020: Aggregator/tool-builder framing (replicable framework)
- Drive: 2026-05-13-second-vertical-brainstorm-desire-driven-asian.md
- Drive: 2026-05-13-second-vertical-research-round-1.md
- Anti-pattern catalog #20: Threads URL preview cache (algorithm trigger 분기점 5-7 posts)
- 矢野経済研究所 (2023): 일본 점복 시장 ¥997억엔 estimate
- Co-Star $40M+ ARR rumored, US 별자리 freemium leader
- The Pattern 8M+ users, freemium personality insights
- AstroTalk India consultation-based marketplace pattern
