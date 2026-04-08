# gstack (vendored) — Elevate에서의 위치

[gstack](https://github.com/garrytan/gstack)은 **구조화된 AI 워크플로**(슬래시 스킬)를 제공한다.  
이 저장소에서는 **프로젝트 맥락·로드맵은 `memory-bank`**, **역할·리뷰 레이어는 gstack**으로 나눈다. 상세한 **레이어 모델·의사결정표**는 **[`docs/AI_ORCHESTRATION.md`](./AI_ORCHESTRATION.md)**.

## Generate skills (one-time per machine)

The upstream `setup` script requires **[Bun](https://bun.sh)** (`bun` on PATH). Install Bun using your preferred method, then:

```bash
cd .agents/skills/gstack
./setup --host auto
```

`--host auto` picks Codex/Cursor-compatible skills when those tools are present. See upstream README for `--host codex`, `--host factory`, and troubleshooting.

**If `setup` has not been run:** slash skills are not registered; **`CLAUDE.md`** still documents the intended workflow. CI does not require gstack.

## Elevate에서 권장하는 쿼런스 (예시)

| 단계 | gstack (선택) | 저장소 측 |
|------|----------------|-----------|
| 방향·압축 | `/office-hours`, `/plan-ceo-review` | `memory-bank/creative-elevate-ai-pivot.md`, `tasks.md` |
| **UI 품질 파이프라인 (권장 순서)** | `/plan-design-review` → `/plan-eng-review` → (구현 후) `/design-review` 또는 `/qa` | **[`docs/design/QUALITY_PIPELINE.md`](./design/QUALITY_PIPELINE.md)** — 하네스(`DESIGN.md`, `SYSTEM.md`)와 함께 쓸 것 |
| 설계·구멍 | `/plan-eng-review` | ADR, `creative-architecture.md` |
| 구현 | — | Cursor INIT→BUILD, `pnpm verify` |
| 출하 전 | `/review`, `/qa` | 커밋 훅 통과 (스킵 금지); 콘텐츠·권한 서사는 [`docs/CONTENT_FUNNEL.md`](./CONTENT_FUNNEL.md)와 구현이 맞는지 대조 |

## 충돌 방지

- **AGENTS.md / Memory Bank / `.cursor/rules`** — 구현 프로세스·커밋·Next.js — **항상 우선**.
- **gstack** — 전략·리뷰·QA 루프. **저장소 규칙을 대체하지 않는다.**

스킬 전체 목록은 루트 **`CLAUDE.md`** § gstack 또는 **`.agents/skills/gstack/AGENTS.md`** 참고.
