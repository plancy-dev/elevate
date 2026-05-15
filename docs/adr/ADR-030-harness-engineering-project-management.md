# ADR-030 — 하네스 엔지니어링 가이드 + gsd 모델 부분 채택 (프로젝트 관리 quality lift)

**Status:** Adopted (W2 D5 evening, immediate adoption for W3 D1+)
**Context:** 2026-05-15 W2 D5 / 사장님 directive — WikiDocs 가이드 2종 study + 프로젝트 관리 quality lift
**Related:** ADR-026 (Verification-first principle), ADR-018 v2 (verification rule), AGENTS.md § AI orchestration, memory-bank/tasks.md

## Background

W2 D5 evening, 사장님 directive로 두 WikiDocs 가이드 read:

1. **하네스 엔지니어링 백과사전 — 시작 가이드** (wikidocs.net/346093) — LLM을 "회사 규칙을 모르는 신입사원", 하네스를 "사무실+도구+규칙+검토 체계"로 설명하는 mental model. 핵심: 모델 실패 진단 전에 **모델이 일하는 환경**을 먼저 진단.
2. **gsd (Get Stuff Done)** — Claude Code용 프로젝트 관리 framework (wikidocs.net/347779). **Milestone → Phase → Task** 계층 + `.planning/` 파일 시스템으로 컨텍스트 소실 방지.

두 가이드의 공통 message: 단순 prompt가 아니라 **환경 (harness) + 구조 (project mgmt)** 가 quality의 ground truth.

### 현재 우리 시스템 vs gsd 차이

| 영역 | 우리 (W2 D5 시점) | gsd 모델 |
| --- | --- | --- |
| 작업 계층 | W{N} D{N} sprint (free-form) | Milestone → Phase → Task (계층 정형) |
| 상태 저장 | `memory-bank/tasks.md` 단일 파일 | `.planning/M{N}/phase-{N}/` 폴더 |
| Phase 사전 spec | 없음 (ad-hoc) | `PLAN.md` (목표 + 태스크 분해 + assumption) |
| Phase 사후 verify | Anti-pattern catalog (사후 capture) | `VERIFICATION.md` (사전 metric 명시 + 사후 측정) |
| Assumption 명시 | Marc dissent (ad-hoc) | `/gsd:list-phase-assumptions` (mandatory) |
| 목표 역방향 검증 | 없음 (test coverage 위주) | `/gsd:verify-work` (기능이 의도대로 동작? 역방향) |

W2 D4 anti-pattern #25 ("Funnel drop empirical 부재 상태에서 feature build")의 root cause는 **Phase-level verification spec 부재**. gsd 모델은 직접 처방.

### 하네스 5 핵심 질문 (가이드 1 부록)

| 질문 | 우리 시스템 mapping |
| --- | --- |
| 이 도구는 어떤 정보를 모델에게 보여 주는가? | CLAUDE.md / AGENTS.md 내용, system prompt scope |
| 어떤 도구를 언제 허용하는가? | `.claude/settings.json` permissions, MCP scope |
| 결과를 어떻게 검증하는가? | Phase VERIFICATION (도입 예정), test, deploy verify (ADR-026) |
| 세션이 끝난 뒤 무엇을 기억하는가? | `memory-bank/` (tasks/activeContext/progress + sprint-syncs) |
| 사람이 언제 개입하는가? | 컨트롤타워 ↔ Code session split, sprint sync, ADR commit |

5 질문 mapping 결과: **세션이 끝난 뒤 기억 (4) + 사람 개입 (5)** 은 이미 정착. **검증 (3)** 이 비대칭적으로 약함 → 직접 보완 대상.

## Decision

**가이드 1 + gsd 모델 핵심 패턴 3가지만 부분 채택. Full gsd fork는 거부.**

### 채택 1 — Phase-level Verification spec routine (mandatory)

모든 sprint Phase 시작 시 `memory-bank/sprint-syncs/W{N}-D{N}-{phase}.md` 에 다음 4 필드 명시:

```markdown
## Phase: <name>

### 목표 (Goal)
<단일 문장. 측정 가능. "Done 정의".>

### Assumptions (검증 안 된 가정 list)
1. <가정 1>
2. <가정 2>
...

### Verification spec (사전 명시 — quantitative)
- Metric: <e.g., Step 1→2 conversion ≥ 5%>
- Source: <e.g., PostHog gagejumsu funnel API>
- Pass criteria: <Boolean>
- Measure window: <e.g., Phase 종료 +24h>

### Reverse-direction check ("기능이 의도대로?")
<Phase 결과물을 사용자 입장에서 1 step 따라가며 의도 vs 결과 mapping. 단순 "태스크 X 완료" 보고 금지.>
```

W3 D1 morning sprint sync부터 적용. 기존 tasks.md 형식 유지 (free-form), 추가로 Phase별 위 4 필드만 명시.

### 채택 2 — 하네스 5 질문 self-check (모든 새 ADR/sprint 시작 시)

ADR 또는 sprint commit 전, 컨트롤타워 (사장님 + Claude) 가 5 질문 self-check:

1. 이 결정이 모델에게 보여 주는 정보를 늘리는가 / 줄이는가 / 정리하는가?
2. 새 도구/permission이 필요한가? 누가 언제 허용?
3. 결정의 성공 여부를 어떻게 검증할 것인가? (Verification spec 필드와 연결)
4. 이 결정의 기록을 세션 종료 후 어디서 찾을 수 있는가? (memory-bank or ADR or anti-patterns)
5. 사람 개입 시점이 어디인가? (사장님 sign-off? Code session ack?)

체크리스트 식 답변 의무화는 X (overhead). 답이 안 떠오를 때만 명시적 작성.

### 채택 3 — Assumption list mandatory (Marc dissent의 systematic 자영업자화)

기존 Marc dissent subagent는 product/marketing decision에 ad-hoc 적용 중. 채택 1의 "Assumptions" 필드 도입으로 **모든 Phase**에 mandatory 확장. 즉 Marc invocation은 surface high-stakes phases (pivot/payment/audience direction) 시 필요시 추가 호출.

## Rejected alternatives

### Full gsd fork (`.planning/` 디렉토리 + 슬래시 커맨드)

- **Pros:** 정형 framework, 도구 표준 (Claude Code superpowers integration)
- **Cons:** Dual state (`memory-bank/` + `.planning/`) — 우리는 이미 memory-bank가 작동 중. Sync overhead. Cursor 통합 하네스에서 slash command 충돌.
- **거부 이유:** memory-bank가 이미 working state. `.planning/` 전체 fork는 *replacement default* anti-pattern (W2 D2 entry) 재발 risk. 채택 1로 핵심 가치 (verification spec)만 수확.

### gsd slash command 도입 (superpowers 설치)

- **Pros:** Lightweight, gstack 기존 슬래시와 호환
- **Cons:** superpowers 미설치 시 dependency. 우리 gstack vendored copy 있음 — 도구 분리.
- **거부 이유:** 현재 단계는 패턴 채택이 우선. 슬래시 자동화는 W3+ 검토 (gstack `/plan-*` 확장 가능성 검토 후).

### 하네스 5 질문을 모든 prompt 시작 시 mandatory

- **Pros:** 일관성 high
- **Cons:** 일상 prompt에 overhead — `git status` 보고 같은 routine에 5 질문 자기검증은 비효율
- **거부 이유:** 새 ADR/sprint 시작 시점에만 적용 (high-leverage moment에만).

## Mechanisms (재발방지 + adoption layer)

### Layer 1 — `memory-bank/PROJECT_MANAGEMENT.md` (이 ADR과 함께 신규 작성)

5 질문 self-check + Phase Verification spec template + Assumption list 형식 single source. Sprint sync 시 참조.

### Layer 2 — Sprint sync template 업데이트 (W3 D1 적용)

Sprint sync 파일 (`memory-bank/sprint-syncs/`) 시작 frontmatter 또는 첫 섹션에 채택 1의 4 필드 강제.

### Layer 3 — ADR template 업데이트

ADR 새로 작성 시 하네스 5 질문 답변이 "Background" 또는 "Decision" 섹션에 자연스럽게 녹아들도록 sprint sync 시 reflection.

## Trade-offs

**Cost:** Phase 시작 시 4 필드 명시 작성 ~5-10분. 5 질문 self-check ~2-3분.
**Benefit:** W2 D4 anti-pattern #25 (funnel empirical 부재 → feature build) 같은 root cause 사전 차단. Verification spec이 Phase commit 전 mandatory면 quantitative metric 부재로 commit 진행 불가.
**Break-even:** Anti-pattern #25 cost (ADR-022 commit 후 funnel empirical 측정 결과 baseline <5% → ADR-023 retroactive baseline 명시 + 후속 Phase 재조정 ~3시간) vs Phase verification spec cost (~10분/Phase). Break-even: 18:1 이상.

## Out of scope

- **`.planning/` 디렉토리 fork** — 거부됨 (위 rejected alternatives 참조)
- **gsd slash command 자동화** — W3+ 검토
- **Verification spec metric 자동 수집** — PostHog + Vercel deploy verify는 ADR-026 routine이 cover. 자동 측정 dashboarding은 W4+
- **가게점수 vertical 적용** — 동일 패턴이지만 ADR-018 boundary 존중. 가게점수 repo의 ADR-018 (이미 commit됨) 또는 신규 ADR로 cross-reference. W3 sprint sync 시점 fork.

## Empirical trigger

- 2026-05-15 W2 D5 사장님 directive — WikiDocs 가이드 2종 read + 프로젝트 관리 quality lift
- W2 D4 anti-pattern #25 root cause (Phase verification spec 부재) 가 systematic 해결책 필요 상태
- 하네스 5 질문 mapping 결과 "검증 (3)" 이 비대칭적으로 약함 — 직접 보완 대상 확인

## Adoption (즉시 적용)

W3 D1 morning sprint sync부터:

1. Sprint sync 파일에 채택 1의 4 필드 (Goal / Assumptions / Verification spec / Reverse-direction check) 명시
2. ADR 또는 sprint commit 전 5 질문 self-check (overhead 최소화 — 답이 안 떠오를 때만 명시)
3. Marc dissent invocation은 high-stakes Phase (pivot/payment/audience direction) 에 surface

## References

- WikiDocs 하네스 엔지니어링 백과사전 — 시작 가이드: https://wikidocs.net/346093
- WikiDocs gsd (Get Stuff Done) 프로젝트 관리: https://wikidocs.net/347779
- ADR-026 verification-first principle (이 ADR의 sister — 외부 시스템 verify vs 이 ADR의 Phase-level verify)
- anti-patterns-w2-d4-d5.md #25 (funnel empirical 부재 → feature build)
- `memory-bank/PROJECT_MANAGEMENT.md` (이 ADR과 함께 신규 작성)
