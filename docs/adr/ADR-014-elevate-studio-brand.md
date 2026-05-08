# ADR-014: Elevate as Studio Brand

## Status

Proposed (Draft) — 2026-05-08
Note: Thread definition (Agenda B output 대기) 통합 후 Accepted 전환.

## Context

보드룸 Agenda A에서 Path C-tight (V0.5 → V1 → V1.5 → V2 conditional)
결정 + 컨트롤타워 synthesis 결과, Elevate의 brand 정체성 재정의 필요성이
surface됐다.

핵심 trigger:

- **Prompt Studio MVP paused 상태** — `memory-bank/creative-elevate-ai-pivot.md`의
  자체 product thesis는 빌드 보류 상태. 솔로 capacity 하에 재개 일정 미정.
- **가게점수가 first cash-generating vertical position 점유** — Path C-tight에
  따라 V0.5 W1 ship + W2 첫 매출 예상. Elevate brand 자체 product 매출보다
  vertical product 매출이 선행.
- **솔로 founder bandwidth 제약** — 자체 product (Prompt Studio) build +
  vertical product (가게점수) build + 콘텐츠 운영 동시 불가능. 셋 중 둘만
  sustainable.
- **Strategic conflict** — Prompt Studio thesis (B2B SaaS for AI workflow
  workers, 글로벌 horizontal)와 vertical product build path (한국 1인
  자영업자, niche vertical)가 audience · voice · distribution 모두 분기.
  한 brand voice로 둘 다 leverage 불가능.

기존 ADR-012 (media-first positioning)는 "콘텐츠 채널 mode 3개월"로
frame했으나, 보드룸 결과 이는 *interim mode*가 아니라 *holding entity의
정체성*으로 evolve됨이 명확.

## Decision

Elevate는 **Studio brand**로 positioning한다 — vertical product를 빌드하는
솔로 founder의 holding entity.

핵심 positioning (internal working thesis vs external positioning 분리):

### Internal working thesis (founder 의사결정용)

1. **Elevate = AI-augmented Studio.** Solo founder가 multi-agent (Cursor,
   Claude Code) orchestration으로 vertical product를 ship한다.
2. **가게점수 = Studio가 빌드한 first vertical.** 향후 verticals는 동일
   Studio framework 하에 운영 (분리 repo · 분리 brand · 동일 ops principle).
3. **Prompt Studio 자체 product thesis는 archived (deleted 아님).**
   `creative-elevate-ai-pivot.md`는 history reference로 보존. *Archived
   의미 = "currently not active North Star". "Dead forever" 아님.* Future
   vertical candidate로 revivable, Agenda B의 vertical 후보 평가 대상에 포함.
4. **Content strategy = Studio operations documentation.** 빌드 과정 ·
   patterns · anti-patterns 공개. 가게점수는 자연 mention OK, ad-style
   push X.

### External brand promise (audience-facing)

External positioning은 "솔로 founder running AI-augmented Studio" —
*founder-led가 first noun, Studio가 adjective*. "Elevate Studio = N개
verticals 운영" 같은 portfolio brand promise는 audience에게 약속하지
않음. 이유: pivot 자유도 self-impose 제약 회피. 가게점수가 시나리오 D
(kill or pivot) 가는 경우 brand fail로 misread되는 risk 차단.

### Studio thread (pending — Agenda B에서 결정)

Studio가 빌드하는 verticals의 *공통 thread* 정의는 보드룸 Agenda B에서
head-to-head cross-examination 후 lock. 후보 5개 (a) Korean markets / (b)
AI-augmented solo founder products / (c) Self-judgment-possible
verticals / (d) Trust gap wedge markets / (e) (a)+(c) intersection.
Agenda B output 받은 후 이 ADR에 통합 → Accepted 전환.

## Consequences

### Documents

- `memory-bank/creative-elevate-ai-pivot.md` 상단에 superseded header
  추가 (작업 2 참조). 파일 삭제 X — North Star pivot history는 보존 가치
  있음.
- `memory-bank/operations-mode-2026-q2.md`에 Studio Brand Identity
  section 추가 (작업 3 참조).
- 향후 vertical 추가 시 본 ADR이 framework reference.

### Content positioning shift

- **Old voice**: "AI-augmented worker, pragmatic skepticism"
- **New voice**: "Solo founder running AI-augmented Studio. Practitioner
  documentation of multi-agent vertical building. Patterns discovered,
  anti-patterns avoided."
- 블로그 · 뉴스레터 voice 정밀화 — 다음 3개 post부터 적용.

### Three-layer thesis 재작성

1. **Layer 1 — Content / Audience build**: Studio operations 문서화. Solo
   founder + AI-augmented build 시 무엇이 실제 일어나는지 공개. 현재
   단계의 primary activity.
2. **Layer 2 — Vertical products portfolio**: 가게점수 first → V1.5 PMF 후
   next vertical. 각 vertical은 Studio framework (분리 repo, 분리 brand,
   동일 ops principle). Cash flow 발생 layer.
3. **Layer 3 — Cross-vertical infrastructure (long-term)**: Verticals 간
   공통 patterns가 자연 emerge할 시 internal tooling 또는 platform화.
   *현재는 hypothesis only, 빌드 X.* Verticals 2-3개 이상 운영 후 재평가.

### Operations

- Cursor 운영 가이드 update 필요 (`operations-mode-2026-q2.md` 변경 후
  Cursor가 reference).
- 블로그 voice 정밀화 — 다음 3개 post부터 적용.
- 가게점수 mention rule: 자연 mention OK, ad-style push X.

### Risks acknowledged

- **Layer 3 premature platform risk**: Cross-vertical infrastructure는
  verticals 2-3개 운영 후에야 patterns 식별 가능. 너무 일찍 build하면
  premature platform trap. *V2 conditional gate와 동일 logic — 데이터
  trigger 후 build.*
- **Brand voice drift risk**: "Studio" framing이 portfolio scattering으로
  misread될 수 있음. 다음 verticals는 *동일 founder authenticity wedge*
  유지하는 vertical만 — 사주 · 의료 · 법률 · 상담 등 자가 판단 불가 영역
  제외 (Founder philosophy lock 유지).
- **Audience confusion risk**: 기존 audience가 "AI workflow worker"
  framing으로 build됐을 시 "Studio operations" pivot이 churn 유발 가능. →
  다음 3 post 발행 후 unsubscribe rate 모니터링, anomaly 시 voice 재조정.
- **External brand promise self-imposed constraint risk**: External
  positioning을 "founder-led, Studio adjective"로 lock한 이유 = portfolio
  brand promise가 pivot 자유도를 self-impose 제약. Internal thesis와
  external positioning 분리 유지 필수.

## Alternatives Considered

### Path A — Studio brand *(selected)*

- **Pros**: 솔로 founder bandwidth realistic. Vertical product portfolio
  expandable. Content strategy와 일관. 가게점수 wedge 활용 가능. ADR-012
  evolution으로 자연스러움.
- **Cons**: Layer 3 (cross-vertical infrastructure)는 long-term hypothesis로
  남음. Immediate platform revenue 없음.

### Path B — Pure content / media business

- **Pros**: 단일 narrative simplicity. Audience build 100% focus.
- **Cons**: Audience scale이 monetization viable한 수준 (subscription ·
  sponsorship)에 도달하려면 12-24 months. Solo bootstrap cash flow 부정합.
  Vertical product build path와 conflict (가게점수가 이미 first paid product
  position 점유).
- **Reject reason**: Premature for current audience size. Cash flow보다
  audience scale 우선이 솔로 부트스트랩에서 비현실적.

### Path C — Resume Prompt Studio thesis

- **Pros**: ADR-012 이전의 original North Star 회복. Single-product focus.
- **Cons**: 솔로 capacity 제약 (Prompt Studio build + 가게점수 build 동시
  불가). Vertical product (가게점수, 한국 자영업자)와 horizontal product
  (Prompt Studio, AI workflow workers)는 audience · voice · distribution
  다름 → 둘 다 약화.
- **Reject reason**: Capacity hard constraint + strategic conflict. 보드룸
  cross-exam에서 *no member defended*.

## References

- 보드룸 회의 결과 (Agenda A — Path C-tight 결정), 2026-05-08
- 컨트롤타워 synthesis (Studio brand identity 도출), 2026-05-08
- ADR-012 (media-first positioning) — 본 ADR이 evolution
- `memory-bank/creative-elevate-ai-pivot.md` — Prompt Studio thesis
  (superseded)
- `memory-bank/operations-mode-2026-q2.md` — operations guide (Studio Brand
  Identity section 추가)

## Decision log

- **2026-05-08**: ADR draft 작성, status `Proposed (Draft)`. Thread
  definition (Agenda B 대기) 통합 후 Accepted 전환 예정.
