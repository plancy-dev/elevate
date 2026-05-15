# ADR-028 — Indie hacker AI persona simulation principle

**Status:** Draft (2026-05-15 W2 D5 evening, ready for W3 D1 adoption)
**Context:** 사장님 명시 framework shift (2026-05-15 W2 D5 evening)
**Supersedes:** Earlier W3 plan P1 "친구·지인 3명 베타 invite" (manual outreach) — rejected by founder

## Founder statement (2026-05-15)

> "우리는 무조건 AI를 활용한 가상의 오디언스를 활용하거나 페르소나를 예측해서 시장에 제품을 출시할 거야 즉, 불필요한 실제 행동은 필요하지 않아. 우리는 인디해커."

## Background

기존 W3 plan (W2 D5 evening)에서 P1으로 "친구·지인 3명 베타 invite" (manual outreach) 권장. 사장님 reject + framework shift:

- Solo founder bandwidth 가장 비싼 자원
- Manual outreach는 시간 + emotional energy + relationship capital cost 큼
- AI persona simulation은 24/7 + zero embarrassment cost
- 인디해커 framework (Pieter Levels archetype, scrappy + AI-leveraged + public building) 와 align

## Decision

**제품 의사결정 (landing, funnel, 콘텐츠, channel strategy)은 AI persona simulation을 1차 도구로 사용한다. Manual user outreach (친구 invite, cold outreach, 친지 베타 등)는 default action에서 제외.**

### What this means

**1. AI Persona가 actual user의 proxy.**
- Secondary research 기반 (시장 통계, 행동 study, demographic 데이터)로 3-5 concrete persona 명시
- 각 persona의 jobs-to-be-done, buying triggers, friction points 명시
- 새 콘텐츠/landing/CTA 결정 시 각 persona가 어떻게 reaction할지 simulate

**2. Hypothesis 검증은 simulation + real funnel data (PostHog) 두 layer.**
- Simulation: persona reasoning + Marc dissent agent verify
- Real: PostHog actual user behavior (현재 14d 53 visitors — small but growing)
- 둘이 disagree 시 real data가 win (anti-hallucination)

**3. Iteration loop가 manual outreach 없이 closes.**
- Persona simulation → product change → PostHog observe → next iteration
- Friend feedback / cold call / interview = 제외 (사장님 attention 손실 + emotional cost)
- 단 자연 발생 user feedback (contact form, email reply 등)은 retain — passive signal

### What this is NOT

- **Hallucination license 아님.** Persona는 secondary research grounded. 가공의 user behavior 가정 금지.
- **Real data 무시 아님.** PostHog funnel + email/contact reaction은 최종 ground truth.
- **모든 인터뷰 부정 아님.** 자연 발생 user reaction (contact form, email reply, comment)은 valuable. 단 사장님이 actively seek out하지 않음.
- **Pivoting away from market 아님.** 자영업자 audience target 그대로. AI persona가 그 audience 대표.

## Persona simulation routine (적용 시점)

새 product change / 콘텐츠 / channel decision 전:

1. **Persona 식별:** 어떤 persona가 이 change에 가장 영향?
2. **Reaction simulation:** 각 persona가 (a) 보고 (b) 어떻게 react (c) action 가능성
3. **Friction prediction:** 어디서 막힐 것 같은가?
4. **Marc dissent layer:** persona simulation 자체에 대한 dissent — 가정 hallucination 검출
5. **PostHog verify:** 실제 사용자 행동과 simulation 비교 (data 누적 시점에)

### Tools

- **`.claude/agents/marc-dissent.md`** (Phase 2 subagent, 이미 배포) — persona reasoning에 indie hacker pragmatist counter-perspective
- **`.claude/agents/dissent-verifier.md`** (Phase 2, 이미 배포) — generator/evaluator pattern으로 reasoning verify
- **PostHog funnel data** — real ground truth
- **Persona doc** (별도 file 작성 — `docs/personas/{vertical}/...`) — secondary research grounded

## Implications

### W3 가게점수 plan update (rejected P1, transformed P2-P4)

| Priority | Original | Updated (ADR-028) |
|---|---|---|
| P1 ❌ | 친구 3명 베타 invite (manual outreach) | **삭제** — manual outreach 제거 |
| P1 ✅ | — | **자영업자 persona 3-5 작성** (secondary research grounded) + landing/funnel persona-simulation audit |
| P2 | Naver Blog 첫 글 | **유지** — passive distribution, manual cost ↓ |
| P3 | 자영업 카페 답글 outreach | **변경** — 사장님 직접 outreach 안 함. AI agent가 카페 글 분석 → 사장님 review → optional post (low-priority) |
| P4 | Funnel friction 진단 (PostHog session replay) | **변경** — persona simulation 1차 + PostHog data 2차 |
| P5 (new) | — | **콘텐츠 form A/B test (persona-driven)** — Threads 5/15 결과 + persona simulation으로 다음 form 결정 |

### Elevate Studio plan (continuity)

ADR-024 (founder framing — audience value framework)와 align:
- Builder/indie hacker reader는 manual outreach 안 한 founder의 thinking 가치 인지
- "AI persona simulation으로 product 결정" 자체가 Studio 콘텐츠 valuable (W3+ essay 후보)
- Studio Dispatch에서 이 framework shift 사건 자체를 dispatch item으로 covered 가능

## Trade-offs

**Cost:**
- Persona simulation은 actual user behavior와 disagreement 가능 (validity gap)
- Secondary research가 audience 대표 못 할 risk

**Benefit:**
- 사장님 attention free (high-cost resource 보존)
- Fast iteration (실제 user wait 없이)
- Embarrassment cost 0 (지인에게 "베타 써봐" 부담 없음)
- 인디해커 brand identity와 align (Pieter Levels-style)

**Net:** 사장님 자원 보존 + speed > validity gap의 marginal cost. PostHog real data가 validity check layer.

## Rejected alternatives

### "Manual outreach + AI simulation hybrid"
- Pros: validity ↑ (real + simulated 둘 다)
- Cons: 사장님 manual cost 그대로
- 거부: 사장님 명시 reject + 인디해커 framework와 conflict

### "Pure PostHog data 의존 (simulation 없음)"
- Pros: real data only, hallucination 0
- Cons: small N (53 visitors 14d) → 통계 의미 약함. iteration speed 느림.
- 거부: simulation으로 사장님 attention 절약 + iteration 가속

### "User interview / survey (synchronous)"
- Pros: deep insight
- Cons: 사장님 시간 + emotional cost. 1인 founder bandwidth 가장 비싼 자원.
- 거부: 사장님 명시 "불필요한 실제 행동" 분류

## Out of scope

- **Asynchronous user feedback** (contact form / email reply / Threads comment 등)은 자연 발생 시 retain. Active solicitation은 제외.
- **자연스러운 user research** (PostHog session replay, GA event funnel) — passive observation OK
- **Paid acquisition + paid user testing** — PMF 후 W5+ 검토

## Empirical trigger

2026-05-15 W2 D5 evening 사장님 framework redirect. W2 D4-5 cron 자동화 stack 완성 후 next sprint plan에서 manual outreach 권장 → 사장님 즉시 reject + AI simulation principle 명시.

## Adoption (W3 D1 morning, 즉시 적용)

W3 시작 시:
1. ADR-028 review + adopt
2. 자영업자 AI persona 3-5 작성 (첫 deliverable)
3. Persona-based landing audit (1.82% drop hypothesis 정밀화)
4. Persona-driven 콘텐츠 form decision (Threads 5/15 결과 + simulation)
5. 모든 향후 product decision은 persona simulation 1차 → PostHog 2차 routine

## References

- ADR-024 founder framing (Studio scope, audience value framework)
- ADR-027 channel strategy by audience purpose
- `.claude/agents/marc-dissent.md`, `dissent-verifier.md` (Phase 2 subagents)
- 사장님 framework redirect 2026-05-15 W2 D5 evening
