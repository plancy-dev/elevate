# AI 워크플로 이식 가이드 (다른 프로젝트)

이 저장소의 패턴은 **“오케스트레이션 문서 + Cursor 규칙 + 컨텍스트 디렉터리”** 삼각 구조다.  
다른 레포로 가져갈 때 **반드시 프로젝트에 맞게 고칠 파일**과 **그대로 옮겨도 되는 개념**을 구분한다.

---

## 1. 검수 요약 (도메인 전문가 관점)

| 판단 | 설명 |
|------|------|
| **구조 변경 필수 아님** | 별도 YAML/DB 없이 **문서 + rules** 만으로 자동 부트스트랩 가능. 추가 레이어는 팀 규모·다중 레포 동기화가 필요해질 때만 검토. |
| **최소 변경으로 이식 가능** | 아래 **Tier B**만 정확히 치환하면 동작한다. |
| **드리프트 방지** | “North Star” 파일명·`pnpm`·`memory-bank` 경로를 **한 곳에만** 두지 말고, 이 문서의 체크리스트로 복제 시 일괄 치환한다. |

---

## 2. 복제 시 손대는 파일 (Tier)

### Tier A — 개념만 참고 (선택 복사)

| 내용 | 비고 |
|------|------|
| `docs/AI_ORCHESTRATION.md` 구조 | 레이어 표·의사결정 표는 범용. **경로·스크립트명은 Tier B에서 치환.** |
| `docs/AI_USER_TEMPLATES.md` | 거의 그대로 사용 가능. 프로젝트명만 변경. |

### Tier B — 반드시 프로젝트에 맞게 수정

| 파일 | 바꿀 항목 예시 |
|------|----------------|
| `docs/AI_ORCHESTRATION.md` | `memory-bank/` 경로, `pnpm verify` → `npm run verify` 등, North Star 파일명, PostHog 등 프로젝트 전용 규칙 링크 |
| `docs/AI_USAGE.md` | 동일 + `package.json`의 스크립트명 |
| `docs/GSTACK.md` | gstack 미사용 시 섹션 삭제 또는 “미사용” 명시 |
| `.cursor/rules/ai-session-bootstrap.mdc` | 읽을 컨텍스트 경로(`memory-bank/...`), 검증 명령, 링크 문서 경로 |
| `.cursor/rules/auto-workflow.mdc` | INIT 단계의 `memory-bank/...` 경로, 예외 조건 |
| `.cursor/rules/cursor-ai-context.mdc` | 상위 문서 링크 |
| `AGENTS.md` | 제품 한 줄, 프레임워크 버전, gstack 여부 |
| `CLAUDE.md` | Skill routing, `pnpm verify`, North Star 경로 |

### Tier C — 새 프로젝트에서 새로 채움 (복제 아님)

| 항목 | 설명 |
|------|------|
| `memory-bank/tasks.md` | 로드맵 SoT — 프로젝트별 |
| `memory-bank/activeContext.md` | 스프린트마다 갱신 |
| `memory-bank/domainKnowledge.md` | 도메인 용어 |
| North Star / creative 문서 | 제품에 맞는 이름으로 |

**컨텍스트 폴더명**을 `memory-bank`가 아닌 `.ai-context` 등으로 바꾸면 **Tier B 전부**에서 경로를 일괄 치환한다.

---

## 3. 복제 체크리스트 (순서)

1. [ ] Tier B 파일을 복사한 뒤 **검증 명령**을 실제 스크립트와 일치 (`package.json` 확인).  
2. [ ] **컨텍스트 디렉터리** 경로를 `ai-session-bootstrap.mdc`와 `AI_ORCHESTRATION.md`에 동일하게 반영.  
3. [ ] `alwaysApply: true` 규칙이 너무 많아지면 토큰 부담 — **부트스트랩 규칙은 짧게 유지** (이 저장소 패턴 유지).  
4. [ ] 프레임워크 문서: Elevate는 Next.js 16 — 다른 스택이면 `AGENTS.md`의 프레임워크 주의 문단 교체.  
5. [ ] gstack 미사용 시: `CLAUDE.md`·`GSTACK.md`에서 gstack 의존 문구 제거 또는 “선택”으로 축소.

---

## 4. Elevate에 추가 구조 변경이 필요한가?

**현 시점 권장: 아니다.**  
단일 설정 파일(예: `ai-config.yaml`)로 경로를 중앙화하면 이식은 쉬워지지만, Cursor 규칙은 **정적 텍스트**라 YAML을 읽지 못한다. 중앙화의 이득은 **다중 레포 템플릿 동기화**가 있을 때만 비용 대비 가치가 있다.

---

## 5. 관련 문서

| 문서 | 용도 |
|------|------|
| [`AI_ORCHESTRATION.md`](./AI_ORCHESTRATION.md) | 레이어·의사결정 |
| [`AI_USER_TEMPLATES.md`](./AI_USER_TEMPLATES.md) | 버그·기능 요청 예시 |
