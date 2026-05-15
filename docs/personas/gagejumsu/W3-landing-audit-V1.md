# 가게점수 Landing Audit V1 (Persona-driven)
**Created:** 2026-05-15 W2 D5 evening
**ADR:** ADR-028 (persona simulation principle)
**Personas:** `docs/personas/gagejumsu/V1-W3-personas.md`
**Empirical baseline:** PostHog 14d funnel 55 → 1 (1.82%) → 1 → 0 → 0

## Method

5 persona x landing 각 section reaction simulate. 각 persona가 어디서 friction 느낄지 식별 + 1.82% Step 1→2 drop의 root cause 가설.

## Current landing structure (read 2026-05-15)

| # | Section | 목적 |
|---|---|---|
| 1 | Hero | Headline + 9,900원 CTA (anchor `#cta` 으로 scroll, NOT `/pay`) + sample preview link |
| 2 | Trust strip | "공개 데이터 소스 기반" 5-icon row (네이버 플레이스 / 검색 / 카카오·구글 / 인스타 / 공공) |
| 3 | TL;DR card | 3 bullet: discoverability blind-spots / 6-area / 9,900원 → 더 자세한 이야기 ↓ |
| 4 | Founder essay | 7-paragraph 1인칭 (카페 1년 → closure → discoverability framing → 41.3% 폐업 통계 → product pitch). Mid-essay inline CTA (small gray underline) |
| 5 | CTABox (`#cta`) | "9,900원 — 1회 진단" + 3 inclusion bullets + pay button (`/pay`) + 베타 코드 toggle |
| 6 | Footer | 사업자 정보 + links |

**CTAs total:** 6 touchpoints. 5개 anchor scroll (`#cta`), 1개만 actual `/pay` routing (CTABox primary).

## Persona-by-persona simulation

### Persona 1 — 민지 (early, 6M 디저트 스튜디오)

**Hero headline reaction:** "내 가게가 검색에서 안 나오는 이유" — strong resonate ✓ (인스타그램 ↑ but 손님 못 들어옴 인지 일치)

**Trust strip:** 익숙한 plates (네이버, 구글, 인스타) → "내가 모르는 영역도 체크해주나" 안심 ✓

**Hero CTA "내 가게 점수 받기 — 9,900원" click:** click probability 60-70%

**Critical friction — Hero CTA fake-out:**
- Click → 결제 페이지 기대 → 같은 page 안 scroll only
- "어? 안 되네?" → 일부는 back button (Step 1→2 contribution 5-10%)
- Mobile에서는 scroll 인지 더 약함

**TL;DR card:** "5분만에 결과" simplifying signal good ✓

**Founder essay 7 paragraphs:** persona 1 reader curious. 길지만 read 가능성 ↑ (mobile scroll: 50%)

**Mid-essay CTA "여기서 한 번 — 내 가게 점수 받기 →":** small gray underline → 못 봄 (visual weight 약함)

**CTABox 도달 시:** "9,900원 결제하고 진단 받기" → click 60-70%

**Persona 1 hypothesis Step 1→2 drop contribution:** 10-15%
- Fake-out + mid-essay CTA visual weight ↓ + mobile scroll fatigue

---

### Persona 2 — 진수 (struggling, 14M 베이커리)

**Hero headline:** moderate resonate ("내가 이미 알고 있는 거" 의심)

**Trust strip:** "내가 이미 다 알아본 거 아닌가" 의심 ↑

**Founder essay critical friction:**
- "1년만에 카페 closure" framing → "1년만에 폐업한 사람이 나한테 advice?" 패턴
- ADR-024 v2에서 "닫았어요" / "닫은 게 아닙니다" trim 됐지만 closure framing 여전 present
- **Persona 2 (struggling 자영업자 dominant)에 가장 큰 trust ↓** — Step 1→2 drop 30-40% contribution

**9,900원 anchor 부재:**
- "이 가격으로 진단받는 가치를 모르겠어"
- 외주 100만원 대비 합리적이지만 anchor 없으면 인지 안 됨

**Aside — Persona 2 channel preference:**
- AI 진단보다 자영업 카페 동료 사장님 advice 신뢰 패턴
- Landing 직접 conversion 가능성 10-20%
- 단 자영업 카페에서 "가게점수 답글" 본 후 도달 시 trust ↑ (Naver 카페 outreach 효과적)

**Persona 2 hypothesis Step 1→2 drop contribution:** 30-40% (largest single contributor)

---

### Persona 3 — 수영 (settled, 28M 카페+공방)

**Hero headline:** 약함 ("내 가게의 다음 step" 같은 framing 더 fit)

**Trust strip:** OK

**Founder essay closure framing:** moderate friction (settled 사장님은 closure 사례에 less personal)

**9,900원 reaction:** "small bet, 한번 받아볼만" but **price anchor 부재** — "100만원 외주 vs 9,900원 진단" 비교 불가

**Sample preview link "진단 결과 샘플 먼저 보기 →":**
- 가장 high-trust action for skeptical settled 사장님
- 현재 small gray underline visual weight 매우 낮음
- 못 봄 → "확신 못 하니 일단 back" → drop

**Persona 3 hypothesis Step 1→2 drop contribution:** 15-20%
- Sample preview 못 봄 + price anchor 부재

---

### Persona 4 — 영호 (예비 창업자)

**Hero sub "1인 카페·디저트·베이커리 사장님":** mismatch (자기 not yet 사장님)
- 즉시 audience mismatch 인지 → drop or just curious browse
- **Target에서 제외이므로 정상 drop** — 10-15% contribution

---

### Persona 5 — 윤정 (부업 사장님)

**Marketing 자체 거부감 ↑:** headline의 "검색에서 안 나오는 이유" 단어가 거부감 trigger
- "내 단골 손님으로 충분, 새로운 marketing 필요 없어" pattern
- **Target에서 priority 낮은 persona이므로 정상 drop** — 5-10% contribution

---

## Aggregate hypothesis (1.82% Step 1→2 drop 원인 priority)

| Priority | Hypothesis | Persona impact | Drop % contribution |
|---|---|---|---|
| **1** | Founder essay closure framing trust ↓ | Persona 2 (dominant) | **30-40%** |
| **2** | Sample preview link visual weight 약함 (대시한 skim-path) | Persona 3 | **15-20%** |
| **3** | Hero CTA fake-out (anchor scroll, not /pay) | Persona 1 | **10-15%** |
| 4 | Audience mismatch (예비 + 부업 sang) | Persona 4 + 5 | 15-25% (정상 drop, target에 미해당) |
| 5 | No social proof + no human face + no FAQ | All personas | 15-20% |
| 6 | Price anchor 부재 | Persona 2 + 3 | 5-10% |

Cumulative drop predicted: ~75-95%. 실제 98.18% drop과 close align — model 신빙성 OK.

## Fix priorities + estimated impact

| Fix | Effort | Expected lift | Persona target |
|---|---|---|---|
| **F1. Hero CTA → /pay 직접 routing** (anchor scroll 제거) | 5분 코드 | +3-5% conversion | 1 민지 |
| **F2. Sample preview link visual upgrade** (badge + above-fold) | 30분 | +2-3% conversion | 3 수영 |
| **F3. Social proof block** (N개 가게 진단됨 counter + 1-2 testimonial — beta 사용자 quote 가능 시) | 1-2시간 | +3-5% conversion | All personas |
| **F4. FAQ section** (3-5 주요 objection: 진단 방법론, 개인정보, 환불, 재진단) | 1시간 | +2-3% conversion | All |
| **F5. Founder essay further trim — closure framing minimize** | 30분 (ADR-024 v3?) | +5-10% (persona 2 dominant 영향) | 2 진수 |
| **F6. Price anchor inline** ("외주 100만 대비 9,900원" or "1일 카페 매출 10% 미만") | 15분 | +1-2% | 2 + 3 |
| **F7. Mid-essay CTA visual weight up** (button-style, not underline) | 10분 | +1-2% | 1 + 3 |

**Cumulative predicted improvement (all fixes applied):** 1.82% → 7-12% range. **Step 1→2 5% threshold (ADR-022/funnel-baseline rule)** 통과 가능.

## Marc dissent layer (verification)

**Dissent 1:** "Hero CTA fake-out이 정말 drop 원인인가? Click → scroll → CTABox 도달 후 그래도 결제 가능?"
- Response: 가능하지만 "click → anchor" friction은 PostHog session replay로 검증 가능. Mobile에서 더 약함. Empirical verify W3 D1+ (session replay 데이터로).

**Dissent 2:** "Founder closure framing이 정말 trust ↓? ADR-024 framing trim 후에도?"
- Response: ADR-024 v2가 emotional negative trim했지만 closure 사실 mention 자체는 유지. Persona 2 (자영업자 dominant)는 closure mention 자체에 react. v3 후보 — closure mention 완전 제거 또는 "이전 운영 경험" 같은 generic 표현으로 transform.

**Dissent 3:** "5 persona simulation의 weights가 실제 traffic mix와 align?"
- Response: Hypothesis. PostHog session replay + 1-2 actual user behavior로 verify 가능 시점에 update. 현재 N=53/14d라 small N.

**Dissent 4:** "1.82% → 7-12% lift 예측이 너무 optimistic?"
- Response: 5 fix 누적 effect 가정. Each fix optimal scenario. 실제는 6-9% range가 conservative 추정. ADR-022 5% threshold는 통과 가능성 높음.

## W3 D1+ implementation order

**Day 1 (P1):** F1 + F2 + F7 (총 1시간 미만, low-effort + medium impact)
**Day 2 (P2):** F5 (founder essay trim) + F6 (price anchor)
**Day 3-4 (P3):** F3 + F4 (social proof + FAQ, content-heavy)

**Validation:** PostHog 7d 후 funnel re-measure. ADR-026 verification-first 적용 (각 fix deploy 후 immediate session replay verify).

## Out of scope

- Multi-language landing (한국어 only target)
- A/B test infra (PostHog feature flags + variant) — W4+
- Hero image / illustration 추가 (현재 text-only OK이지만 W4+ visual upgrade 검토)
- Pricing tier 변경 (9,900원 keep — separate ADR if change)
