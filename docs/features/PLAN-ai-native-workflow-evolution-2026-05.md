# PLAN — AI-native 업무 방식 진화 (리서치 기준일: 2026-05-03)

**목적:** 업계·커뮤니티·벤더 기술 블로그에서 확인되는 **2026년 초 기준** AI-assisted / agentic 개발 관행을 정리하고, Elevate의 **Memory Bank + Cursor + gstack** 스택과 비교해 **합리적·효율적인** 개선안을 **구현 준비(PLAN)** 수준으로 고정한다.  
**범위:** 문서·규칙·스킬·훅·CI·팀 루틴. 코드베이스 대규모 리팩터는 포함하지 않는다.  
**다음 단계:** 이 PLAN 승인 후 **BUILD**에서 우선순위(P0→P2)대로 이슈/PR로 쪼갠다.  
**구현 전 문서 검증:** [`PLAN-ai-native-workflow-doc-gate.md`](./PLAN-ai-native-workflow-doc-gate.md) — P0–P2 문서가 PR에 올라왔는지 한 페이지에서 확인한다.

---

## 1. 리서치 요약 (출처별)

### 1.1 Anthropic — 하네스·장기 에이전트

- [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents): **initializer vs coding** 역할 분리, 세션 간 **구조화된 산출물**(진행 로그, JSON 상태 등), **한 번에 한 기능** incremental, 끝날 때 **머지 가능한 깨끗한 상태**·커밋·요약.
- [Harness design for long-running application development](https://www.anthropic.com/engineering/harness-design-long-running-apps): planner / generator / **evaluator**(MCP로 실제 클릭·검증), **스프린트 계약**(무엇이 done인지 합의) 등 고신뢰 하네스.
- [Scaling Managed Agents](https://www.anthropic.com/engineering/managed-agents): **brain / hands / session** 분리, 세션 로그를 컨텍스트 밖 저장소로 — “메타 하네스” 관점.

**Elevate 매핑:** `elevate-work-harness`(INIT 별칭 `elevate-memory-bank-bootstrap`) + `tasks`/`activeContext`/`progress` = initializer·handoff에 가깝다. **Evaluator** 축은 gstack `/qa`·`/browse`·`pnpm verify`·CI로 부분 충족.

### 1.2 OpenAI Codex — 커스터마이징·스킬·OSS 사례

- [Customization](https://developers.openai.com/codex/concepts/customization): **AGENTS.md**(작게) + **Skills**(반복 워크플로) + **MCP**(외부) + **서브에이전트** — 상호보완.
- [Agent Skills](https://developers.openai.com/codex/skills): 메타데이터 우선 로드, **progressive disclosure**, 설명에 트리거·경계, repo는 **`.agents/skills`** 스캔 등.
- [Using skills to accelerate OSS maintenance](https://developers.openai.com/blog/skills-agents-sdk): **if/then 필수 스킬**(`$implementation-strategy`, `$code-change-verification`, …), **Docs MCP**로 할루시네이션 감소, **Codex GitHub Action**으로 CI에 동일 하네스 이식.

**Elevate 매핑:** 루트 `AGENTS.md` + `.cursor/rules` + gstack `.agents/skills` + **`.cursor/skills/elevate-work-harness`**(통합 하네스). **필수 스킬 라우팅 if/then**은 아직 Codex 수준으로 엄밀하진 않음 → **§4 P1**.

### 1.3 Cursor — 규칙·스킬·에이전트 모범 사례

- [Rules (AGENTS.md, .cursor/rules)](https://cursor.com/docs/context/rules): **Team → Project → User** 우선순위, **nested `AGENTS.md`**, glob·description으로 토큰 절약.
- [Best practices for coding with agents](https://cursor.com/blog/agent-best-practices): Rules는 **짧게·핵심만**, 내용 **복붙보다 파일 참조**; Skills는 **동적** 워크플로; **`.cursor/plans/`**에 플랜 저장 팀 공유; **명시적 프롬프트**가 수용률↑; 룰은 **반복 실수 날 때만** 추가.

**Elevate 매핑:** 이미 강한 규칙 세트·오케스트레이션 허브 존재. **리스크:** `alwaysApply: true` 룰이 많으면 상한에 근접할 수 있음 → **§4 P1 감사**.

### 1.4 Stack Overflow — 설문(2025) 커뮤니티 현실

- [AI 섹션 (2025 Developer Survey)](https://survey.stackoverflow.co/2025/ai/): 도구 도입은 넓으나 **정확도 신뢰 하락**, “거의 맞는데 아님” **좌절**, **에이전트는 아직 주류 아님**(단순 보조 모드 비중).
- [SO Blog 요약 (2025-07)](https://stackoverflow.blog/2025/07/29/developers-remain-willing-but-reluctant-to-use-ai-the-2025-developer-survey-results-are-here/): 신뢰·검증·인간 전문성 강조.

**시사:** 자동 생성물에 대한 **리뷰·검증 하네스**를 제품에 박는 것이 경쟁 우위. Elevate의 **`pnpm verify` + REFLECT + `/review`** 방향과 정합.

### 1.5 보조: 업계 서베·커뮤니티 큐레이션 (비공식/3자 포함)

- [Digital Applied — AI Coding Tool Adoption 2026 (Q1 2026 필드워크 주장)](https://www.digitalapplied.com/blog/ai-coding-tool-adoption-2026-developer-survey): “**리뷰**가 **작성**보다 주당 시간을 앞선다”는 등 **에이전트·비동기 PR** 확산 가설 — *제3자 자기보고이므로 수치는 참고용*.
- Reddit·포럼 논의는 [murataslan1/cursor-ai-tips](https://github.com/murataslan1/cursor-ai-tips) 등 **큐레이션 저장소**에 집약: **긴 디버그는 새 채팅**, **Agent 전 방어적 커밋**, **한 대화에서 모델 혼선 금지**, **Research → Plan → Execute** 루프, **Context7 MCP** 등.

**Elevate 매핑:** “새 채팅 + 요약”은 `AI_EXPERT_PROMPTS` handoff와 결합 가능. Context7은 이미 MCP 생태와 맞음 — **선택 P2**.

### 1.6 국내 — 토스·앱인토스

- [토스페이먼츠 MCP 서버 구현기](https://toss.tech/article/37777): 문서만 주면 **시크릿 키 클라이언트 노출·플로우 오류**; **MCP + Cursor**에서 **정확도·안전** 개선.
- [앱인토스 AI 개발 가이드](https://developers-apps-in-toss.toss.im/development/llms.html): `llms.txt` / **MCP** / **@docs** 명시.

**Elevate 결제 레일 SoT (앱):** 카탈로그·빌링은 **Lemon Squeezy + Polar** — [`ADR-004`](../adr/ADR-004-lemon-squeezy-global-payments.md), [`ADR-005`](../adr/ADR-005-payment-rails-lemon-primary-toss-deferred.md). 위 두 외부 링크는 **MCP·문서 연동 패턴** 참고용이며, 레포의 결제 구현 경로와 혼동하지 말 것.

**Elevate 매핑:** 결제·외부 API 작업 시 **공식 MCP·문서 도구** 우선 호출을 규칙에 한 줄 더 박기(§4 P1). (이미 PostHog 등 MCP 사용 중인 패턴 확장.)

---

## 2. Elevate 현황 (강점)

| 축 | 상태 |
|----|------|
| 단일 오케스트레이션 허브 | [`docs/AI_ORCHESTRATION.md`](../AI_ORCHESTRATION.md), [`AGENTS.md`](../../AGENTS.md) Operating model |
| 페이즈·복잡도 | `workflow-modes.mdc`, L1–L4, INIT→ARCHIVE |
| 상태 SoT | `memory-bank/tasks.md`, `activeContext.md`, `progress.md` |
| 세이프가드 | Husky, `commit-verification`, `pnpm verify`, CI, PostHog 규칙 |
| 스킬 | gstack vendored + `elevate-work-harness` + UI 스킬 |
| 세션 부트스트랩 | `ai-session-bootstrap.mdc` (자동) + [MEMORY_BANK_SKILL_GUIDE.md](../MEMORY_BANK_SKILL_GUIDE.md) (명시) |

---

## 3. 갭 분석 (우리 vs “프런티어” 관행)

| 관행 (외부) | 갭 | 비고 |
|-------------|-----|------|
| if/then **필수** 스킬 게이트 | 부분적 | gstack은 “권장”; Codex OSS처럼 **저장소 강제 문구**는 미약 |
| **Evaluator** 루프 | 부분적 | `/qa`·브라우저는 선택; **모든 L2+ PR에 브라우저 스모크**는 비용 큼 |
| **Nested AGENTS.md** | 없음 | 모노리포 수준은 아니나 `src/app` vs `src/components/marketing` 분리 시 이점 |
| **장기 세션 오염** 대응 | 암묵적 | “20턴 이상 디버그 → 새 채팅” 문서화 부족 |
| **Hooks (IDE)** | 미정 | Cursor Hooks로 **Agent 전 커밋 알림** 등 — Amazon 사고급은 아니나 **실수 방지**에 기여 가능 |
| **플랜 아티팩트 공유** | 부분적 | Cursor `.cursor/plans/` 권장과 **팀 내 위치** 정렬 여지 |
| **토큰 예산 (룰 팽창)** | 리스크 | alwaysApply 룰 **감사** 필요 |

---

## 4. 구현·수정 백로그 (BUILD 준비)

우선순위는 **비용 대비 효과**와 **이미 스택과의 정합** 기준.

### P0 — 문서·루틴만으로 즉시 (1 PR 이내)

1. **`docs/MEMORY_BANK_SKILL_GUIDE.md`** 또는 **`docs/AI_EXPERT_PROMPTS.md`**에 **짧은 절** 추가:  
   - 긴 디버그(예: **~20 메시지** 초과) 시 **새 채팅 + `tasks`/`activeContext` 인용 한 블록 요약** 후 계속.  
   - 출처: 커뮤니티 큐레이션([cursor-ai-tips](https://github.com/murataslan1/cursor-ai-tips)) + Anthropic “깨끗한 handoff” 정신.
2. **`docs/AI_ORCHESTRATION.md`** §4 옆에 **한 문단**: 외부 API·결제·PII 구역은 **MCP/공식 문서 도구 우선**(토스 사례).

**수용 기준:** 위 두 곳 중 최소 한 곳에 반영, 링크로 이 PLAN 참조.

**P0 구현 체크 (저장소, 문서 PR):**

- [x] [`docs/MEMORY_BANK_SKILL_GUIDE.md`](../MEMORY_BANK_SKILL_GUIDE.md) — § 긴 디버그·세션 리셋
- [x] [`docs/AI_EXPERT_PROMPTS.md`](../AI_EXPERT_PROMPTS.md) — §1b + MEMORY_BANK_SKILL_GUIDE 링크
- [x] [`docs/AI_ORCHESTRATION.md`](../AI_ORCHESTRATION.md) — §4 외부 API·결제·MCP 우선 문단

### P1 — 정책·구조 (1~3 PR)

**진행:** 베이스라인 감사 표 [`docs/CURSOR_RULES_AUDIT.md`](../CURSOR_RULES_AUDIT.md) · verify if/then은 [`docs/AI_ORCHESTRATION.md`](../AI_ORCHESTRATION.md) **§2.6** + [`AGENTS.md`](../../AGENTS.md) BUILD 행.

**P1 잔여 처리(저장소):**

- [x] `posthog-integration.mdc` / `completion-and-commit.mdc` — `globs: []` 명시
- [x] nested `AGENTS.md` — 팀 합의 전 스킵([`CURSOR_RULES_AUDIT.md`](../CURSOR_RULES_AUDIT.md) §)

3. **`.cursor/rules` 감사 표**: 파일별 `alwaysApply` / glob / 줄 수 개요를 `docs/` 또는 `memory-bank/`에 **한 페이지**로 두고, **분할·축소 후보** 표시 ([Cursor agent best practices](https://cursor.com/blog/agent-best-practices)).
4. **REFLECT 게이트 문구 표준화** (OpenAI OSS 패턴 차용):  
   `AGENTS.md` 또는 `AI_ORCHESTRATION.md`에 **“코드·테스트·예제·빌드 터치 시 REFLECT 전 `pnpm verify`”** if/then을 더 명시적 문자열로 (이미 있으면 **중복 제거**만).
5. **선택: nested `AGENTS.md` 파일 1~2개**  
   예: `src/app/(dashboard)/AGENTS.md`, `src/app/[locale]/(marketing)/AGENTS.md` — **각 40줄 이하**, 루트 `AGENTS.md`로 링크만.

**수용 기준:** 감사 문서 merge; verify 문구 중복 없이 강화; nested 파일은 팀 합의 후 추가(없으면 P2로 미룸).

### P2 — 도구·자동화 (별도 이슈)

**RFC 문서:** [`docs/features/PLAN-ai-native-workflow-p2-rfc.md`](./PLAN-ai-native-workflow-p2-rfc.md) — Hooks / Docs MCP / CI 이중 하네스 범위·수용 기준·결정 질문·**문서/구현 PR 경계**.  
**문서 게이트:** [`PLAN-ai-native-workflow-doc-gate.md`](./PLAN-ai-native-workflow-doc-gate.md) — 머지 전 경로 검수·구현 준비 조건.

6. **Cursor Hooks** — 예: Agent 시작 전 “working tree clean 또는 의도된 WIP” 알림. **보안·정책** 검토 후 적용.  
7. **Context7 또는 공식 Docs MCP** — 새 외부 SDK 도입 시만 켜는 **문서 스킬** (토큰 비용 고려).  
8. **Codex GitHub Action** 수준의 **CI 이중 하네스**는 비용·유지보수 큼 → **gstack + 기존 CI**로 충분한지 분기 판단 후 결정.

---

## 5. 성공 지표 (3개월 스냅샷 제안)

- **리뷰/검증:** L2+ 기능 PR에 **REFLECT 증거**(리뷰 요약 또는 QA 로그 링크) 비율.
- **회귀:** `main`에서 `pnpm verify` 실패 건수(주간).
- **컨텍스트:** 에이전트 턴당 **불필요한 전문 로그 붙여넣기** 감소(정성 + 온콜 피드백).
- **온보딩:** 신규 기여자가 **MEMORY_BANK_SKILL_GUIDE + 한 번의 스킬 호출**로 첫 PR까지 도달하는지 시간 측정(선택).

---

## 6. 리스크·주의

- **서베·블로그 수치**는 자기보고·마케팅이 섞일 수 있음 — **저장소 내 측정**(CI, PR 템플릿, 시간)을 우선.
- **룰·스킬 과다**는 오히려 라우팅 실패·토큰 낭비 — “추가 시 삭제 대상도 정한다”는 **정리 규칙**을 `archive-and-cleanup` 철학과 맞출 것.
- **Reddit 단일 스레드**는 노이즈 큼 — **공식 문서 + SO 설문 + 벤더 엔지니어링 블로그**를 1차, 커뮤니티는 **검증된 큐레이션**만 2차로 사용한다(본 PLAN 방식).

---

## 7. 참고 링크 모음

| 출처 | URL |
|------|-----|
| Anthropic long-running harness | https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents |
| Anthropic harness design (evaluator 등) | https://www.anthropic.com/engineering/harness-design-long-running-apps |
| Anthropic Managed Agents | https://www.anthropic.com/engineering/managed-agents |
| OpenAI Codex customization | https://developers.openai.com/codex/concepts/customization |
| OpenAI Codex skills | https://developers.openai.com/codex/skills |
| OpenAI OSS + skills blog | https://developers.openai.com/blog/skills-agents-sdk |
| Cursor rules | https://cursor.com/docs/context/rules |
| Cursor agent best practices | https://cursor.com/blog/agent-best-practices |
| Stack Overflow 2025 AI | https://survey.stackoverflow.co/2025/ai/ |
| SO blog 2025-07 | https://stackoverflow.blog/2025/07/29/developers-remain-willing-but-reluctant-to-use-ai-the-2025-developer-survey-results-are-here/ |
| Third-party 2026 adoption survey (참고) | https://www.digitalapplied.com/blog/ai-coding-tool-adoption-2026-developer-survey |
| Reddit 큐레이션 (GitHub) | https://github.com/murataslan1/cursor-ai-tips |
| 토스 MCP 구현기 | https://toss.tech/article/37777 |
| 앱인토스 AI 가이드 | https://developers-apps-in-toss.toss.im/development/llms.html |

---

## 8. PLAN 승인 후 BUILD 순서 (권장)

1. **P0** 문서 PR (가이드 + 오케스트레이션 소폭).  
2. **P1** 룰 감사 표 + `AGENTS.md`/`AI_ORCHESTRATION` 정리 PR.  
3. **P2** Hooks / Docs MCP / CI Codex — 별도 RFC 이슈.

**PLAN 완료 정의:** 위 백로그가 이슈/PR로 쪼개졌고, `memory-bank/tasks.md`에 **에픽 한 줄**(선택)이 반영되면 된다.
