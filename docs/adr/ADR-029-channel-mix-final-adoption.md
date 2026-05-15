# ADR-029 — Channel mix final adoption (Threads deprioritize, Naver focus)

**Status:** Adopted (2026-05-15 W2 D5 evening)
**Context:** W2 D4-5 Threads empirical batch analysis (5/14 founder reflection 96/0 + 5/15 helpful tip expected mid-tier + 20+ Threads feed posts with engagement numbers visible)
**Related:** ADR-024 (founder framing), ADR-027 (channel by audience purpose), ADR-028 (AI persona simulation)
**Decision authority:** 사장님 위임 ("너가 결정해줘 가장 좋은 방향으로")

## Background

W2 D4 가게점수 Threads post (founder reflection) → 96 views / 0 engagement. W2 D5 evening 사장님이 Threads feed empirical share (5 batches, 20+ posts with engagement numbers visible):

**High engagement (♥80+) post 공통:**
1. 스하리/반하리/스친/맞팔 슬랭 dense (community reciprocity currency)
2. Milestone announcement (366명, 200명 등)
3. Casual emoji-rich (3-5 line, 🔥💚🤍)
4. Authority claim 또는 twist humor
5. 명시적 reciprocity CTA

**Low engagement (♥5-15) post (growth_retention "자영업자이야기" pattern):**
- Generic advice text-only
- Wisdom statement form
- **가게점수 5/14, 5/15 voice form과 거의 동일** → empirical proof of low engagement on Threads

**Threads 자영업자 community 본질:**
- "스하리 economy" — explicit reciprocity social contract
- Mutual support audience ≠ paying customer audience
- Follower-seeking, not problem-solving
- Engagement는 content quality보다 follower base × mutual history weighted

## Decision

**Threads는 가게점수 product의 channel-mode와 mismatch.** Threads는 Mode 1.5 (visual promote + community currency)이고 가게점수 product는 Mode 2+3 (helpful + discover)이다. ADR-027 channel strategy 명시한 mode-fit principle 적용.

**Channel mix (effort distribution):**

| Priority | Channel | Mode | Effort % | 사장님 weekly cost |
|---|---|---|---|---|
| **Primary** | Naver Blog SEO | Mode 2 (Helpful) + Mode 3 (Discover) | 30% | 30min/week |
| **Primary** | 자영업 네이버 카페 답글 (AI-assisted) | Mode 2 (Helpful) | 30% | 25min/week |
| **Secondary** | Threads visual post weekly | Mode 1 (Promote) minimal | 10% | 5min/week |
| **Tertiary** | Twitter/X Elevate Studio brand | Mode 1+2 mix (Builder audience) | 10% | 5min/week W4+ |
| **Future** | LinkedIn / Indie Hackers / Hacker News | Mode 2 (Builder) | 10% | W5+ |
| **Buffer** | Persona simulation, PostHog review, product decisions | — | 10% | — |

**Total 사장님 manual cost:** ~1h/week (모든 channel 합산).

## Rejected alternatives

### Option A (Threads 적극 push + brand voice transform)
- Pros: Short-term reach 가능성
- Cons: (a) 사장님 1-2h/day cost — burnout risk (b) 스하리 audience ≠ paying customer (c) ADR-024 founder framing 손상 (d) Sustainable 안 됨
- 거부 이유: 4/5 criteria fail

### Option C (Hybrid 2 account — gagejumsu brand + 사장님 personal)
- Pros: Brand dignity + community currency 분리
- Cons: (a) 2 account 운영 cost (b) 사장님 personal account 운영도 attention cost (c) Indirect conversion path
- 거부 이유: Complexity vs benefit unclear

### Status quo (Threads single-channel test)
- Pros: 변경 없음
- Cons: Empirically confirmed mismatch (5/14 96/0 + 5/15 mid-tier expected)
- 거부 이유: Empirical evidence 명확

## Adoption details

### 1. Naver Blog SEO (Primary, 30%)

**Setup:**
- 사장님 Naver Blog 계정 (없으면 가입, 가게점수 brand 명의)
- 첫 글 publish (이미 draft 작성: `outputs/2026-05-15-shop-visibility-7-checks.md`)
- 주 1-2 글 cadence

**Content form:**
- Long-form 실용 tip (1,500-2,500 words)
- SEO keywords ("자영업 SNS 노출", "네이버 플레이스 등록", "카페 검색 안 보일 때")
- 사장님 own voice 또는 컨트롤타워 draft

**AI agent role:**
- Weekly draft 작성
- SEO keyword research
- Naver SEO optimization

**사장님 cost:** 30분/week (review + publish)

**Expected outcome:**
- Week 1-4: minimal traffic (SEO build up)
- Week 5+: organic Naver search traffic 시작
- Conversion: helpful → 가게점수 inline link → click rate 2-5%

### 2. 자영업 네이버 카페 답글 (Primary, 30%)

**Setup:**
- 사장님 가입 카페 3-5개:
  - 자영업자 협동조합
  - 1인 사장 협회
  - 카페·베이커리 사장 모임
  - 자기경영연구회
- 카페 read access 확보

**Routine (AI-assisted):**
1. 사장님이 카페 글 1-2개 share (5분)
2. 컨트롤타워가 답글 draft (helpful + 가게점수 자연 mention)
3. 사장님 review (3분)
4. 사장님 본인이 publish

**답글 form:**
- Helpful first (practical advice)
- 가게점수 link은 마지막 1줄, indirect CTA ("관심 있으시면")
- ADR-028 manual outreach 정의와 분리 (public comment on public post = community participation)

**사장님 cost:** 5분/day × 5 days = 25분/week

**Expected outcome:**
- Week 1-2: reputation 빌드
- Week 3+: direct conversion 첫 paying customer 후보
- Cumulative: 자영업자 community 안 가게점수 brand awareness ↑

### 3. Threads visual post weekly (Secondary, 10%)

**Cadence:** 주 1회 (예: 일요일 18:00 KST)

**Form (corrected from W2 D5 batch analysis):**
- **[Image: 진단 결과 sample 또는 가게 photo]**
- **1-2 line brand text**
- **gagejumsu.com**

**Why minimal:** Threads는 mode mismatch confirmed. Visual presence만 brand awareness 차원.

**사장님 cost:** 5분/week

**금지:**
- Founder reflection form (empirically confirmed low engagement)
- Helpful tip text-only (same)
- 스하리 economy slang adoption (brand dignity 손상)

### 4. Twitter/X Elevate Studio (W4+, 10%)

**Setup:** Elevate Studio brand account (가게점수와 분리)

**Content:**
- Essays publish 시 thread share
- ADR-024 founder framing 적합 (Builder audience)
- 가게점수 vertical과 분리

## Trade-offs

**Cost:**
- Threads 5/14, 5/15 publish 시도가 sunk cost (empirical learning value retain)
- Naver SEO short-term ROI 0 (long-term play)

**Benefit:**
- 사장님 attention 보존 (인디해커 framework)
- Mode-fit channel = conversion friendly
- Sustainable + scalable
- Brand dignity retain

**Net:** Long-term sustainable + 사장님 자원 보존 + ADR-024/027/028 framework alignment.

## Out of scope

- Threads complete abandon (weekly minimal post retain)
- Substack / Resend Dispatch send pipeline (별도 ADR-016 fill)
- Instagram Reels (W4+ 검토)
- Paid acquisition (PMF 후 W5+)

## Verification (W3-W4 empirical)

**W3 D5 checkpoint:**
- Naver Blog 첫 글 publish + 24h traffic
- 자영업 카페 답글 5-10건 + reaction
- Threads weekly visual post + engagement
- PostHog funnel re-measure

**W4 D5 checkpoint:**
- Naver Blog 2-4 글 cumulative + Naver search traffic 시작 여부
- 자영업 카페 첫 paying customer 후보
- Threads minimal participation 정상화

**Pivot triggers:**
- W4 끝나면 자영업 카페 paying customer 0명 → 답글 form 변경 또는 카페 변경
- Naver Blog Week 8 organic search traffic 0 → SEO strategy 재검토
- Threads weekly visual post 4주 후 engagement 0 → completely abandon 검토

## Empirical trigger (이 ADR 채택 이유)

- W2 D4 Threads 96/0 founder reflection
- W2 D5 evening 20+ Threads post empirical batch with engagement numbers
- growth_retention "자영업자이야기" ♥5 (= 가게점수 voice form proof of low engagement on Threads)
- 스하리 economy 인지 (community currency reciprocity)

## References

- ADR-024 founder framing
- ADR-027 channel strategy by audience purpose
- ADR-028 indie hacker AI persona simulation
- `docs/personas/gagejumsu/V1-W3-personas.md` (V2 update pending)
- `outputs/2026-05-15-shop-visibility-7-checks.md` (Naver Blog first draft)
