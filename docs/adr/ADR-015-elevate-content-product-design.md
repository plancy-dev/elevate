# ADR-015: Elevate Content Product Design (Essays + Studio Dispatch)

## Status

Accepted — 2026-05-08

## Context

ADR-014 (Elevate Studio brand identity)가 lock된 후, content output을 어떻게 *product*로 design할지에 대한 articulation gap이 surface됐다. ADR-014는 Studio brand + voice rules 3개를 정의했으나, 그 voice가 어떤 *콘텐츠 형식*에 어떤 *cadence*로 어떤 *distribution*으로 deploy되는지는 미명시 상태.

컨트롤타워 self-applied articulation pressure session (2026-05-08)에서 5개 Q-cluster를 통해 articulation gap을 식별 + 의사결정:

- Content product unit 정의 (post 단위가 아닌 *product* 단위)
- 두 product 간 distinct scope · length · cadence
- Distribution 형식 (self-hosted vs platform mirror)
- 6 topic axes (operations-mode-2026-q2)와 reference canon (Stratechery / Lenny / Gawande)의 mapping rule
- Phase 1 audience build와 Phase 2 monetization의 boundary trigger

(Q1-Q5 exact wording은 별도 session 문서; 본 References 참조.)

본 ADR은 ADR-014 framework *내부*의 operational product specification. ADR-014 lock 변경 X — 본 ADR은 voice rules 위에서 product를 design.

기존 operations-mode-2026-q2.md의 cadence ("블로그 주 3회, 뉴스레터 주 1회")는 *generic frequency target*이었으나 content product framing 부재로 quality · scope · distribution 일관성을 enforce할 수 없는 상태였음. 본 ADR이 그 gap을 codify.

## Decision

1. Elevate's content output consists of two distinct products: Essays (longform practitioner publication) and Studio Dispatch (weekly build report).
2. Essays are 1,500–2,500 word analytical pieces anchored in concrete artifacts from Studio's own building, published 1–2 per week, archive-valuable.
3. Studio Dispatch is a weekly build report (~400–700 words) covering one specific decision/artifact, its reasoning, its cost, and one open question; published every Thursday at 9 AM ET (NY time, DST-aware).
4. Both products share the practitioner publication voice defined in ADR-014 (founder-led narrative, build documentation tone, vertical-specific naming) and map to one of six topic axes from operations-mode-2026-q2.
5. Each essay must invoke at least one reference canon layer (Stratechery analytical spine / Lenny practitioner evidence / Gawande procedural thesis) explicitly mapped at outline stage.
6. Information architecture uses the terms "Essays" and "Dispatch" (not "Blog" and "Newsletter") to signal product commitment to the audience.
7. Distribution is self-hosted at the Elevate domain (no Substack/Medium mirror), supplemented by founder personal social channels and selective Hacker News submissions for thesis-level essays.
8. Phase 2 monetization (paid tier, sponsorship, etc.) is deferred until 30+ essays published and Phase 2 trigger from ADR-014 (3 verticals + $50K/month sustained 6 months) is approached; audience-build is the Phase 1 primary objective.

## Consequences

### Cadence revision

- **기존** (operations-mode-2026-q2.md): "블로그 주 3회 (Mon/Wed/Fri) + 뉴스레터 주 1회 (Thursday)"
- **신규**: "Essays 1–2/week + Studio Dispatch every Thursday 9 AM ET (NY time, DST-aware)"

총 outputs/week가 4 → 2–3으로 감소. Cadence cost 감소 trade-off로 quality (1,500–2,500 word essays + archive value)를 enforce. Marc dissent perspective (cadence frequency가 indie audience build의 standard) 대비 Studio brand commitment의 explicit choice — 본 trade-off는 Risks Acknowledged에 기록.

### Terminology change

- "Blog" → "Essays" (collection noun, plural) 또는 "Essay" (instance, singular)
- "Newsletter" → "Studio Dispatch" 또는 "Dispatch"
- Information architecture · UI · 사이트 navigation · meta tags · OG tags 모두 새 용어로 unify
- **ADR-014 voice rules 3개 wording은 그대로 보존** — voice rules는 lock된 decision artifact, 본 ADR이 retroactive change X

### 인프라 schema (Claude Code 작업 대상)

신규 또는 update 필요한 테이블:
- `essays`: id, slug, title, body, topic_axis, reference_canon_layer (enum: stratechery|lenny|gawande), word_count, published_at, vertical_tag (nullable)
- `dispatches`: id, slug, week_of, decision_artifact, reasoning, cost, open_question, published_at
- `subscribers`: id, email, source (organic|hn|social|referral), subscribed_at, status

ADR-013 (PostHog) 이벤트 schema도 product 분리 반영 — `essay_view`, `dispatch_view`, `essay_share`, `dispatch_subscribe` 등.

### 콘텐츠 운영 (Cowork) instruction 반영

Cowork (또는 daily 운영 agent)가 본 ADR을 reference로:
- Essay outline 단계에서 reference canon layer 1개 explicit mapping (Decision sentence 5) — outline review가 mandatory phase, skip 발견 시 publish reject
- Dispatch는 weekly cadence Thursday 9 AM ET DST-aware lock (Decision sentence 3)
- 두 product 모두 ADR-014 voice rules 3개 적용 (Decision sentence 4)
- 6 topic axes mapping은 publish 전 verify

### Inaugural essay reframe

"The 60-Minute Boardroom"을 inaugural essay로 reframe — 본 ADR이 정의한 essay product의 first instance + reference quality benchmark. Word count (1,500–2,500), anchored artifact (보드룸 회의 자체), reference canon layer mapping (Gawande procedural — 회의 procedure가 thesis carrier)이 product spec과 일치하는지 publish 전 verify. Inaugural essay가 spec을 violate하면 spec retrofit 또는 essay rework 둘 중 하나 *forced choice*.

## Risks Acknowledged

- **Cadence reduction risk**: 4 outputs/week → 2–3 outputs/week. operations-mode-2026-q2의 W4 monitoring trigger ("다음 3 post unsubscribe rate")가 *post 정의 변경*으로 baseline shift. W4 monitoring criteria refresh 필요 — 새 baseline은 "first 3 essays + first 3 dispatches" 분리 측정 또는 통합 측정. *Founder 별도 결정 pending — 본 ADR 범위 외.*
- **Pieter Levels archetype trade-off (Marc dissent perspective)**: Practitioner publication framing은 high frequency · high volume · personal brand의 indie hacker standard와 trade-off. Marc dissent reframed: "Studio brand commitment의 cost는 audience build velocity 감소". 채택 근거: Phase 1 archive value + reference canon layer가 long-tail SEO + thesis-level credibility build에서 high-frequency보다 우월하다는 가정. *가정 unverified — 30 essays 시점 organic discovery 데이터로 retrospective 평가.*
- **Self-hosted only distribution risk**: Substack의 built-in subscriber discovery network 미사용 → initial growth slower. 채택 근거: brand integrity + Studio domain commitment + email list ownership. Trade-off는 30 essays + 6 months 시점에 mirror 옵션 재평가.
- **Reference canon enforcement risk**: Decision sentence 5의 "explicitly mapped at outline stage" 강제가 essay velocity를 추가 감소시킬 수 있음. Mitigation: Cowork instruction에서 outline review를 mandatory phase로 lock — 이는 cost가 아닌 quality gate.
- **Inaugural essay spec mismatch risk**: "The 60-Minute Boardroom"이 본 ADR spec과 mismatch 시 retrofit 또는 rework forced choice. 둘 중 하나가 다른 작업 unblock 지연 가능.

## Alternatives Considered

### Path A — Substack mirror (cross-post for distribution)

- **Pros**: Substack subscriber discovery network 활용. Initial growth velocity 우월.
- **Cons**: Brand integrity 분산 (Studio domain ↔ Substack URL). Email list ownership Substack에 일부 lock. Future Phase 2 monetization 시 platform 종속성.
- **Reject reason**: Studio brand commitment + email list ownership이 initial growth velocity보다 우선. ADR-014 voice rule 3 ("vertical brand front under Studio umbrella")과 일관.

### Path B — Tiered paid (Phase 1부터 free + paid 분리)

- **Pros**: Cash flow 조기 발생. Subscriber willingness to pay 빠른 검증.
- **Cons**: Phase 1 audience build의 primary objective는 *audience scale*. Paid wall이 organic share + HN submission velocity 감소. ADR-014 Phase framework와 conflict.
- **Reject reason**: Phase 1 audience build blocker. Phase 2 trigger 도달 시 reopen.

### Path C — Magazine multi-author

- **Pros**: Output volume scale + voice diversity.
- **Cons**: Solo founder 현실과 mismatch. Editorial overhead + hiring cost + voice consistency 관리. ADR-014 voice rule 1 ("founder is first noun") 위반.
- **Reject reason**: Solo founder mismatch. Phase 2 단계에서 reopen 가능 (multi-author Studio expansion).

## References

- ADR-014 (Elevate Studio brand identity) — voice rules + Phase framework + 6 topic axes 출처
- 컨트롤타워 self-applied articulation pressure session, 2026-05-08 — 5 Q-cluster decisions (Q1-Q5 exact wording은 session 별도 기록)
- "The 60-Minute Boardroom" piece — inaugural essay reference quality benchmark
- ADR-013 (PostHog analytics) — 인프라 schema 일관성 reference
- ADR-005 (결제 인프라) — Phase 2 monetization 시 reference
- `memory-bank/operations-mode-2026-q2.md` — cadence + terminology + 6 topic axes 정의 (본 ADR과 동일 commit에서 update)

## Decision log

- **2026-05-08**: ADR-015 작성. 컨트롤타워 5 Q-cluster articulation pressure 결과 통합. Status `Accepted`.
