# Memory Bank — Elevate

이 디렉터리는 **Elevate** 프로젝트의 단일 요약 컨텍스트입니다. 다른 저장소에서 복사한 내용은 **본 README·tasks.md 기준으로 덮어쓴 상태**입니다.

## 파일

| 파일 | 용도 |
|------|------|
| **tasks.md** | 로드맵·페이즈·우선순위 (SoT) |
| **progress.md** | 완료 vs 열린 일 요약 (SoT는 tasks) |
| **archive/design-v2/** | 시각 언어 v2 자료 아카이브 (현재 SoT는 ADR-011) |
| **marketing-content-pipeline.md** | PLG·블로그↔전자책·PostHog·gstack 역할 (Phase M) |
| **marketing-pillars-m2.md** | M2 필라 5개·다국어 우선순위·에디토리얼 캘린더 템플릿 |
| **activeContext.md** | 지금 페이즈, 다음 작업 앵커 |
| **creative-architecture.md** | 아키텍처·스키마·라우트 구조 결정 |
| **techStack.md** | 기술 스택 한 페이지 요약 |
| **domainKnowledge.md** | MICE 용어·도메인 메모 |
| **archive/** | REFLECT·대체된 CREATIVE 등 — [`archive/index.md`](archive/index.md) |

## 갱신 규칙

- **페이즈 전환·스프린트 시작**: `activeContext.md` + `tasks.md` 체크박스
- **기능 완료 시**: `progress.md`
- **아키텍처 변경 시**: `creative-architecture.md`

**Editor's Desk v3 SoT:** [`docs/adr/ADR-011-design-system-v3-editors-desk.md`](../docs/adr/ADR-011-design-system-v3-editors-desk.md) · [`docs/features/PLAN-editors-desk-s0-s1-s2.md`](../docs/features/PLAN-editors-desk-s0-s1-s2.md).

## gstack과의 관계

- **Memory Bank** = 이 프로젝트의 **상태·우선순위·도메인** (SoT). gstack으로 옮기거나 대체하지 않는다.
- **gstack** (`.agents/skills/gstack`) = **리뷰·전략·QA** 등 구조화된 역할 프롬프트. 설치는 `docs/GSTACK.md`.
- **통합 허브**: `docs/AI_ORCHESTRATION.md` — 레이어·의사결정표·프롬프트 계약.
- **전문가 세션·복붙**: `docs/AI_EXPERT_PROMPTS.md` — Memory Bank 필수 로드 + 블록 A~D.

## Cursor

- **에이전트 페이즈 모델 (INIT→ARCHIVE):** [`AGENTS.md`](../AGENTS.md) § **AI orchestration → Operating model** (레포 최우선; `workflow-modes.mdc`·`AI_ORCHESTRATION.md`와 정합)
- 규칙: `.cursor/rules/memory-bank-guide.mdc`
- 워크플로우: `.cursor/rules/workflow-modes.mdc`
- AI 진입점: `docs/AI_USAGE.md` → 상세 `docs/AI_ORCHESTRATION.md`
- 전문가 복붙 프롬프트(Memory Bank 강제 로드): `docs/AI_EXPERT_PROMPTS.md`

## 시크릿

저장소에 **Supabase 서비스 롤**, **MCP 토큰**, **Stitch/Google API 키**를 커밋하지 않습니다. `.env.local` 및 Cursor MCP UI에서만 설정합니다.
