# PROJECT_MANAGEMENT.md — Phase verification spec + 하네스 5 질문

**Status:** Adopted 2026-05-15 W2 D5 evening (ADR-030)
**Scope:** Elevate Studio repo + 가게점수 vertical (W3+ fork)
**Replaces:** sprint sync free-form (보완, not replace)

## 1. 왜 이 파일이 있는가

WikiDocs 가이드 2종 (하네스 엔지니어링 / gsd) 의 핵심 패턴 3가지를 우리 프로젝트에 부분 채택 — ADR-030 결정. 이 파일은 sprint sync 시 참조하는 **lightweight playbook**.

핵심 message: **모델이 실패했다고 말하기 전, 모델이 일하는 환경 (harness + project mgmt) 이 제대로 설계되었는가를 먼저 묻는다.**

W2 D4 anti-pattern #25 (Funnel drop empirical 부재 상태에서 feature build) 의 root cause는 Phase-level verification spec 부재. 이 playbook이 직접 처방.

## 2. Phase verification spec (mandatory — 모든 sprint Phase 시작 시)

Sprint sync 파일 (`memory-bank/sprint-syncs/W{N}-D{N}-{phase}.md`) 의 각 Phase 시작 섹션에 다음 4 필드 명시:

```markdown
## Phase: <name>

### 목표 (Goal)
<단일 문장. 측정 가능. "Done 정의".>
예: "가게점수 landing funnel Step 1→2 conversion ≥ 5% 달성"

### Assumptions (검증 안 된 가정 list)
1. <가정 1 — e.g., "타겟 audience가 '진단 받기' CTA 의도를 인지">
2. <가정 2 — e.g., "Threads 트래픽 ≥ 80% mobile">
...

### Verification spec (사전 명시 — quantitative)
- **Metric:** <e.g., Step 1→2 conversion rate>
- **Source:** <e.g., PostHog gagejumsu funnel API project 413397>
- **Pass criteria:** <Boolean — e.g., conversion ≥ 5%>
- **Measure window:** <e.g., Phase 종료 +24h>

### Reverse-direction check ("기능이 의도대로 동작하는가?")
<Phase 결과물을 사용자 입장에서 1 step씩 따라가며 의도 vs 결과 mapping. 단순 "태스크 X 완료" 보고 금지.>
예: "사용자가 Threads 글 → landing 진입 → CTA 클릭 → 결과 페이지 → '진단 받기' 의도를 30초 내 인지하는가?"
```

### 빠른 양식 (작성 5-10분 가이드)

- **Goal:** Done = ____ 형식. Phase 종료 시 binary pass/fail.
- **Assumptions:** "이게 사실일 것이다" 문장 3-5개. Marc dissent 후보.
- **Verification spec:** 측정 ground truth 명시. Source가 부재면 Phase 진행 불가 (먼저 측정 infra 구축).
- **Reverse-direction:** "Done" 보고 vs "사용자에게 실제로 의도대로 도달했는가" gap 사전 차단.

### Pass / Fail 처리

- **Pass:** Verification spec metric ≥ pass criteria → Phase 완료 commit. Sprint sync에 measure 결과 + date 명시.
- **Fail:** Phase rollback or Verification spec 조정 (단순 lowering bar 금지 — Assumption 검증 또는 다른 Phase fork).

## 3. 하네스 5 질문 self-check (새 ADR / sprint 시작 시)

ADR 또는 sprint commit 전, 컨트롤타워 (사장님 + Claude) 가 다음 5 질문 self-check. 답이 안 떠오를 때만 명시적 작성 (overhead 최소화).

1. **정보:** 이 결정이 모델에게 보여 주는 정보를 늘리는가 / 줄이는가 / 정리하는가?
2. **도구:** 새 도구/permission이 필요한가? 누가 언제 허용?
3. **검증:** 결정의 성공 여부를 어떻게 검증할 것인가? (Phase verification spec 필드와 연결)
4. **기억:** 이 결정의 기록을 세션 종료 후 어디서 찾을 수 있는가? (memory-bank / ADR / anti-patterns)
5. **개입:** 사람 개입 시점이 어디인가? (사장님 sign-off / Code session ack / Marc dissent invocation)

### 5 질문 mapping (참고)

| 질문 | 우리 시스템 layer |
| --- | --- |
| 정보 | CLAUDE.md / AGENTS.md, system prompt scope, memory-bank cross-link |
| 도구 | `.claude/settings.json`, MCP scope, gstack slash, custom hooks |
| 검증 | Phase verification spec, ADR-026 deploy verify, test |
| 기억 | memory-bank/, sprint-syncs/, archive/, ADR commit |
| 개입 | 컨트롤타워 ↔ Code session split, sprint sync, ADR commit, Marc dissent |

## 4. Assumption list mandatory (Marc dissent 확장)

기존 Marc dissent subagent는 product/marketing decision에 ad-hoc 적용. 위 Phase verification spec의 "Assumptions" 필드 도입으로 **모든 Phase**에 mandatory 확장.

### Marc invocation 기준

- 모든 Phase: "Assumptions" 필드 self-list (sprint sync 작성자가 직접)
- High-stakes Phase: **명시적 Marc dissent invocation 추가**
  - Pivot (positioning / vertical scope 변경)
  - Payment / billing 변경 (결제 게이트 / 가격 / refund policy)
  - Audience direction (target persona / channel 변경)
  - Repo boundary (Studio vs vertical 결정)

Marc dissent 결과는 sprint sync 또는 ADR Decision 섹션에 paste — anti-pattern catalog 와 cross-reference.

## 5. 거부된 사항 (도입 안 함)

### Full gsd `.planning/` fork
- 거부 이유: memory-bank가 이미 working state. Dual state → sync overhead. *Replacement default* anti-pattern (W2 D2) 재발 risk.

### 5 질문 모든 prompt 시작 시 mandatory
- 거부 이유: `git status` 보고 같은 routine에 5 질문 self-check는 비효율. 새 ADR / sprint 시작 시점에만 적용.

### gsd slash command 자동화 (superpowers 설치)
- 거부 이유: 현재 단계는 패턴 채택 우선. 슬래시 자동화는 W3+ 검토 (gstack `/plan-*` 확장 가능성 검토 후).

## 6. 가게점수 vertical 적용 (W3+ fork)

ADR-018 (Studio vs vertical repo boundary) 존중. 가게점수 repo에 동일 패턴 fork 시점:

1. 가게점수 repo에 신규 ADR (예: ADR-024 vertical 또는 next 번호) 생성 — 이 ADR-030 cross-reference
2. 가게점수 `memory-bank/PROJECT_MANAGEMENT.md` 복사 + vertical-specific 예시 (가게점수 funnel metric 등) replace
3. 가게점수 sprint sync template에 4 필드 mandatory 명시

W3 sprint sync 시 fork.

## 7. References

- ADR-030 (이 playbook의 결정 ADR)
- ADR-026 (Verification-first principle — 외부 시스템 verify; 이 playbook 은 Phase-level verify)
- ADR-018 v2 (verification rule — product/marketing alignment)
- WikiDocs 하네스 엔지니어링 백과사전 시작 가이드: https://wikidocs.net/346093
- WikiDocs gsd: https://wikidocs.net/347779
- anti-patterns-w2-d4-d5.md #25 (이 playbook 이 직접 처방)
