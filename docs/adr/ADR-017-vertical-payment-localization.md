# ADR-017: Vertical Payment Localization

## Status

Accepted — 2026-05-11 (post-hoc codification of 가게점수 V0.5 production deployment)

## Context

**ADR-005** (Toss DROP 후 Lemon Squeezy global USD payment lock-in)이 Studio-level default payment currency를 USD-only로 lock한 source ADR이다. ADR-014 (Elevate Studio brand identity + Phase 1 Korean self-employed focus)는 payment scope를 다루지 않으며, ADR-014의 invocation은 별도 — Decision sentence 3 ("verticals must operate in categories with existing trust scars where honest brand entry serves as differentiation wedge", 즉 filter (d) trust gap wedge mechanism)이 *왜 vertical-specific override가 정당화되는지*의 근거 제공.

가게점수 V0.5가 2026-05-11 production live되면서 Polar.sh **KRW ₩9,900** 결제로 deploy됨 — 이는 ADR-005의 USD-only Studio-level lock과 explicit conflict (vertical level에서).

핵심 인식:

- **Studio-level operations (Elevate brand)의 audience** = 한국 generic professional / creator + global spillover. ADR-005 USD default가 consistent.
- **Vertical product (가게점수)의 audience** = Korean self-employed / 소상공인. 이 audience의 trust scars (ADR-014 filter (d) 적용 대상)에는 *foreign currency 결제 friction*이 포함됨.
- 즉 KRW localization은 ADR-014 trust gap wedge mechanism의 *operational implementation*이며, ADR-005 USD-only lock의 vertical-level override를 정당화한다.
- Polar.sh는 KRW + USD 모두 지원 → platform-level lock 변경 없이 vertical-level override 가능.

대안 검토: (A) ADR-005 amendment — ADR-005에 vertical override clause 추가. (B) 별도 ADR-017 분리. 후자 채택 근거 = ADR-005의 core concern (payment processor selection, Toss DROP 결정 history)과 vertical-level currency localization은 *분리된 concern*이며, ADR-005에 vertical-마다 override 누적되면 ADR-005 scope creep + readability degrade.

본 ADR은 *de facto adoption*을 codify — V0.5 production deploy가 이미 KRW로 ship된 상태. Status `Proposed (Draft) → Accepted` 즉시 전환 trigger는 production reality.

본 ADR은 ADR-005의 vertical-level scope만 supersede하며, Studio-level USD default lock은 unchanged 유지.

## Decision

1. Each vertical product may localize payment currency to its primary audience.
2. 가게점수 prices in KRW (₩9,900) via Polar.sh, targeting Korean self-employed audience.
3. Studio-level operations (Elevate Essays subscription if introduced Phase 2) default to USD per ADR-014.
4. Cross-vertical revenue reporting is normalized to USD at commit-time exchange rate.
5. Currency choice for new vertical = vertical product team decision, not Studio-level policy.
6. Polar.sh is approved payment processor for KRW; Lemon Squeezy remains approved for USD verticals.
7. Refund and dispute handling follows local payment processor conventions per vertical.
8. ADR-017 supersedes ADR-005 USD-only payment lock for vertical products; ADR-005 Studio-level lock unchanged.

## Consequences

### Documents

- **ADR-005** (결제 인프라) 본문 변경 X — 본 ADR이 vertical-level override를 explicit하게 codify하여 ADR-005 Studio-level lock과 coexist. ADR-005 References section에 본 ADR cross-reference 추가 권고 (별도 task).
- **ADR-014** (Elevate Studio brand identity) 본문 변경 X — ADR-014는 Studio brand identity + Phase framework이며 payment scope 아님. 본 ADR이 ADR-014 filter (d) trust gap wedge mechanism을 invoke하여 vertical override의 정당화 근거로 활용.
- 향후 새 vertical 시작 시 본 ADR이 currency decision framework reference.

### Operations

- 가게점수 KRW ₩9,900 (Polar.sh) — V0.5 deploy 시점부터 active. Rollback 없음.
- Cross-vertical revenue dashboard (PostHog 또는 별도 admin) USD-normalization 필요 — commit-time exchange rate 적용 logic. Per-currency raw도 보존 (단일 USD aggregate에만 의존 X).
- Refund SOP per vertical — 가게점수의 경우 한국 소비자 보호법 + Polar.sh refund policy 준수. SOP 문서화는 별도 task.
- Tax handling — 한국 VAT 처리 + 통신판매업 신고 등은 가게점수 측 (vertical local jurisdiction).

### Schema

- Revenue events에 `currency` field 명시 (ISO 4217: KRW · USD). Default 추정 금지.
- Reporting aggregation은 USD-normalized snapshot + per-currency raw 둘 다 보존.
- PostHog 이벤트 schema에 `currency`, `amount_local`, `amount_usd_normalized`, `exchange_rate_commit` 4-tuple 표준화 권고.

## Risks Acknowledged

- **Cross-vertical revenue aggregation 복잡화**: Currency 분기로 단일 number ("total ARR")가 항상 exchange-rate dependent. Commit-time rate 적용 정책으로 일관성 확보하되, FX volatility 노출. Mitigation = per-currency raw 보존 + USD snapshot 보조.
- **Multi-currency support burden (future verticals)**: 새 vertical마다 currency 선택 + payment processor 선택 + local 세무 학습. Solo founder bandwidth cost. *Phase 1 verticals는 모두 Korean self-employed → KRW 단일 가능성 높음으로 부분 mitigate.* Phase 2 (global expansion 옵션 reopen)에서 본 risk 본격화.
- **Tax/regulation은 vertical local jurisdiction**: 한국 자영업자 대상 vertical = VAT + 통신판매업 신고 등. Solo founder가 vertical마다 local tax compliance 학습 필요. 가게점수 = Korean tax stack lock-in.
- **Studio-level vs vertical-level boundary 흐림 risk**: Founder가 동일 legal entity로 운영 → 회계상 separate 아님. "Vertical-level decision"은 *정책적* framing이지 legal separation X. Phase 2에서 vertical 매출 scale 증가 시 legal entity 분리 재검토 trigger. 본 ADR은 *operational* policy로 범위 제한, legal restructure는 future ADR.

## Alternatives Considered

### Path A — ADR-005 amendment (override clause 추가)

- **Pros**: Single source of truth for payment policy. ADR 수 minimize.
- **Cons**: ADR-005의 core decision (payment processor selection, Toss DROP history)에 vertical override policy mixing → ADR-005 scope creep. Future vertical마다 ADR-005에 amendment 누적 → readability degrade.
- **Reject reason**: Cleanliness. Vertical currency localization은 ADR-005 concern (processor selection)과 분리된 concern.

### Path B — 별도 ADR-017 분리 *(selected)*

- **Pros**: Single concern per ADR. Vertical-level operational decisions가 누적될 때 ADR-005 본질 보존. Future verticals의 currency decision이 본 ADR을 reference framework로 사용 가능.
- **Cons**: ADR count 증가. Cross-reference 관리 cost.
- **Accept reason**: 본 decision의 nature — (i) vertical 반복 적용 + (ii) de facto adoption codification + (iii) ADR-005 processor selection과 직교 — 가 단독 ADR에 적합.

### Path C — Status quo (USD-only lock 유지, 가게점수 KRW rollback)

- **Pros**: ADR-005 lock literal 준수.
- **Cons**: V0.5 production live KRW 결제 rollback = user-facing breakage + audience friction (Korean self-employed에 USD 결제 강제). ADR-014 filter (d) trust gap wedge mechanism과 conflict (foreign currency = audience trust scar).
- **Reject reason**: Production reality + audience match. ADR-014 Phase 1 thesis와 일관.

## References

- **ADR-005 (결제 인프라, Toss DROP 후 Lemon Squeezy global USD payment lock)** — 본 ADR의 supersession target. Studio-level USD payment default 출처.
- **ADR-014 (Elevate Studio brand identity)** — trust gap wedge mechanism 출처 (Decision sentence 3, filter (d)). 본 ADR의 vertical override 정당화 근거. *Payment scope 아님 — payment lock source 아님.*
- 가게점수 V0.5 production deploy, 2026-05-11 — de facto adoption trigger.
- 보드룸 Agenda B (per ADR-014) — Phase 1 Korean self-employed focus, vertical thread filter (d) 정합.

## Decision log

- **2026-05-11**: 가게점수 V0.5 production live with Polar.sh KRW ₩9,900. ADR-005 USD-only payment lock과 vertical-level conflict surface.
- **2026-05-11**: 컨트롤타워 분석. Amendment (Path A) vs 별도 ADR (Path B) trade-off 검토. Path B 채택 권고.
- **2026-05-11**: ADR-017 작성. Status `Proposed (Draft) → Accepted` 즉시 전환 — V0.5 production deploy가 de facto adoption confirmation.
- **2026-05-11**: Cross-session catch from [elevate] SW engineer Code session — supersession target 정정 (ADR-014 → ADR-005). Sentence 8 wording update. References reframed (ADR-005 = supersession target, ADR-014 = trust gap wedge invocation). ADR record accuracy.
