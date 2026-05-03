# RFC — AI-native workflow P2 (도구·자동화)

**상위 SoT:** [`PLAN-ai-native-workflow-evolution-2026-05.md`](./PLAN-ai-native-workflow-evolution-2026-05.md) §4 P2  
**상태:** RFC(문서). 구현은 **별도 PR**로만 진행한다.  
**구현 전 검증:** [`PLAN-ai-native-workflow-doc-gate.md`](./PLAN-ai-native-workflow-doc-gate.md)

---

## 0. 문서 PR 범위 vs 다음 구현 PR (경계)

| 구분 | 포함 | 포함하지 않음 |
|------|------|----------------|
| **문서 PR (이번 파도)** | 이 RFC 본문 보강, doc-gate, PLAN·AI_* 상호 링크, `memory-bank/tasks.md` 한 줄, ADR README, 규칙 **프론트매터만**(예: `globs: []`) | Hooks 실행 파일, `mcp.json` 실제 추가, 새 CI 워크플로, 앱 런타임 코드 |
| **다음 구현 PR** | `.cursor/hooks/` + README, 팀이 승인한 MCP만 `mcp.json.example` 문서화·선택 항목, (합의 시) 릴리즈/nightly용 추가 Action | 이 RFC를 머지하지 않은 채로만 무리하게 도입 |

순수 문서만 바뀐 PR은 [`AI_ORCHESTRATION.md`](../AI_ORCHESTRATION.md) §2b의 verify **예외**에 해당할 수 있다. 다만 팀이 요구하면 그래도 `pnpm verify`를 돌린다.

---

## 1. 범위 (P2 백로그에서 가져옴)

| ID | 항목 | 목적 |
|----|------|------|
| P2-6 | **Cursor Hooks** | Agent 전후에 안전·일관 알림(예: 큰 변경 전 working tree 확인). 정책·보안 검토 후 도입. |
| P2-7 | **Context7 / 공식 Docs MCP** | 새 외부 SDK 도입 시에만 켜는 **문서 우선** 플로 — 토큰·노이즈 vs 정확도 트레이드오프. |
| P2-8 | **CI 이중 하네스 (Codex GitHub Action 등)** | OpenAI OSS 패턴과 동일 검증을 CI에서도 돌릴지 **비용 대비** 판단. |

---

## 2. 의사결정 요약 (질문 → 기본안)

| 주제 | 질문 | 기본안(합의 전 가정) |
|------|------|----------------------|
| CI | gstack `/ship` 또는 Codex Action을 **기본 브랜치마다** 추가할까? | **`pnpm verify` + 기존 Actions**를 단일 SoT로 유지. 중복은 플레이크·비용만 증가할 수 있음. 추가 실험은 **릴리즈 브랜치 또는 nightly**만. |
| Hooks | Agent 전에 경고/게이트를 둘까? | **팀 합의 후**만 최소 도입. “`pnpm verify` 없이 큰 diff 커밋”류는 **거짓 양성**이 나기 쉬워 문구·조건을 먼저 RFC에 고정한다. |
| Docs MCP | 기본 개발자가 MCP를 켜야 하나? | **아니오.** 새 결제·인증·외부 HTTP SDK를 **처음** 넣을 때만 선택적으로 켠다([`AI_ORCHESTRATION.md`](../AI_ORCHESTRATION.md) §3). |

---

## 3. 수용 기준 (한 줄씩)

| ID | 수용 기준 |
|----|-----------|
| P2-6 | Hooks는 **로컬만** 실행, **비밀·토큰 없음**; 저장소 내 **경로·동작**이 README 한 페이지에 문서화된 뒤에만 공유한다. |
| P2-7 | **MCP를 끈 상태**에서도 `pnpm verify` 및 일상 개발이 가능해야 한다. 예시는 `mcp.json.example`의 **선택** 항목으로만 추가한다. |
| P2-8 | 기본 브랜치 CI는 **중복 하네스를 늘리지 않는다**가 원칙; 예외는 RFC·이슈에 비용·롤백 계획을 적고 승인한다. |

---

## 4. P2-6 Hooks — 제안

- **후보 이벤트:** Cursor **Hooks**(제품 UI 이름은 버전에 따름). 로컬 스킬: `~/.cursor/skills-cursor/create-hook/SKILL.md` 또는 [Cursor 문서](https://cursor.com/docs) 최신본을 확인한다.
- **최소 동작:** “`pnpm verify` 안 돌린 채로 큰 diff만 커밋하려 할 때” 경고는 **팀 합의** 후에만(거짓 양성 방지).
- **구현 시:** `.cursor/hooks/`(또는 팀이 정한 경로) + README 한 페이지.

---

## 5. P2-7 Docs MCP — 제안

- **트리거:** 새 결제·인증·외부 HTTP SDK를 **처음** 넣을 때만 MCP 켜기(레포 [`AI_ORCHESTRATION.md`](../AI_ORCHESTRATION.md) §3).
- **구현 시:** `mcp.json.example`에 선택 항목으로 문서화; 기본 개발자는 끈 상태로도 `pnpm verify` 통과.

---

## 6. P2-8 CI 이중 하네스 — 결정 질문

- **질문:** gstack `/ship` 또는 Codex Action이 **추가**로 돌아가야 하는가, 아니면 `pnpm verify` 한 번이면 충분한가?
- **권장(초기):** 이 저장소는 이미 **Lint / typecheck / test / build**를 CI에서 수행 — **중복 실행은 에너지·플레이크 비용**만 늘릴 수 있음. 별도 Action은 **릴리즈 브랜치** 또는 **nightly**로만 실험.

---

## 7. 다음 액션 (체크리스트)

- [ ] 팀: P2-6 hooks **도입 여부** 결정
- [ ] 팀: P2-7 MCP **허용 목록**(공급자) 결정
- [ ] 팀: P2-8 **실험 브랜치 / nightly** 여부 결정
- [ ] 구현 PR마다 이 RFC 업데이트 또는 `memory-bank/tasks.md`에 증거 한 줄

---

## 8. 구현 준비 완료(다음 세션 진입)

1. 이 RFC와 [`PLAN-ai-native-workflow-doc-gate.md`](./PLAN-ai-native-workflow-doc-gate.md)가 **main에 머지**됨.  
2. (권장) GitHub 이슈 **「P2 구현 백로그」**에 위 §7 체크리스트를 복사해 추적; 구현 PR 본문에 `Refs #N`.  
3. 머지 직후 **REFLECT 한 줄**(doc-gate §4 예시).

---

## 9. 머지 후 REFLECT (한 줄 예시)

> P2 RFC 기본안(verify+기존 CI, MCP 조건부, Hooks 합의 후) 유지. 다음: Hooks 초안 검토 → MCP 예시만 example → CI는 보류.
