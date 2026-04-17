# 개발 프로세스 — GitHub Issues · PR · Figma · gstack

이 문서는 **Elevate 저장소**에서 기능을 구현하거나 “다음에 할 일”을 볼 때의 **단일 절차**다.  
상위 원칙은 [`docs/AI_ORCHESTRATION.md`](./AI_ORCHESTRATION.md)(레이어 A→B→C)와 동일하며, 여기서는 **원격 이슈·디자인 링크·gh CLI**를 끼워 넣는다.

---

## 1. 레이어 (충돌 시 순서)

| 순서 | 무엇 | 역할 |
|------|------|------|
| A | `AGENTS.md`, `.cursor/rules/*`, 커밋 훅 | 구현·보안·Next.js 제약 |
| B | `memory-bank/tasks.md`, `activeContext.md` | 제품 우선순위·맥락 SoT |
| B′ | **GitHub Issues / PR** | **원격에서 추적 가능한 작업 단위**, 리뷰·릴리즈 이력 |
| C | gstack (`/plan-*`, `/qa`, …) | 검토·QA·출하 **프레이밍** ([`docs/GSTACK.md`](./GSTACK.md)) |
| — | **Figma** | UI 스펙·프레임 링크 (디자인 SoT는 여전히 [`docs/design/SYSTEM.md`](./design/SYSTEM.md)) |

- **memory-bank만으로도** 로드맵은 돌아가지만, **팀·에이전트·미래의 나**를 위해 **구현 단위는 GitHub 이슈에 남기는 것**을 권장한다.
- **gstack은 memory-bank를 대체하지 않는다** ([`AI_ORCHESTRATION.md`](./AI_ORCHESTRATION.md) §1).

---

## 2. “이 기능 구현해줘” — 권장 프로세스

1. **이슈** — 없으면 생성(GitHub **New issue** 또는 템플릿). Studio 씬 렌더 트랙은 [`.github/ISSUE_TEMPLATE/scene_render_task.yml`](../.github/ISSUE_TEMPLATE/scene_render_task.yml) 사용 가능.
2. **에픽·마일스톤** — 해당 시 [Epic #1](https://github.com/plancy-dev/elevate/issues/1) 또는 마일스톤 `Scene render · P0`–`P3`에 연결.
3. **Figma** — 해당 프레임 **Share → Copy link** 후 이슈 본문에 붙인다. 파일 루트: [`.github/DESIGN.md`](../.github/DESIGN.md).
4. **gstack / 품질 파이프라인** — UI·제품 성격이면 [`docs/design/QUALITY_PIPELINE.md`](./design/QUALITY_PIPELINE.md) 순서(디자인 플랜 → 엔지 플랜 → 빌드 → verify).
5. **구현** — 브랜치 `issue-N-short-name`; PR 본문에 `Closes #N` 또는 `Refs #N`.
6. **검증** — 이 저장소는 **`pnpm verify`** 가 단일 게이트 (`package.json`).

---

## 3. “다음에 할 작업 목록 보여줘” — 원격 조회 (gh CLI)

[`GitHub CLI`](https://cli.github.com/) 설치 후 `gh auth login`. 저장소 루트에서:

| 목적 | 명령 |
|------|------|
| Studio 관련 **열린** 이슈 | `pnpm issues:studio` (래퍼) 또는 아래와 동일 |
| `area/studio` 라벨 | `gh issue list --label area/studio --state open` |
| 씬 렌더 에픽 라벨 | `gh issue list --label epic/scene-render` |
| 마일스톤 P0 | `gh issue list --milestone "Scene render · P0" --state open` |
| 이슈 본문 보기 | `gh issue view <번호>` |
| 웹에서 열기 | `gh issue view <번호> --web` |

**에픽 한눈에 보기:** `gh issue view 1` 또는 `https://github.com/plancy-dev/elevate/issues/1`

> 조직 정책상 **GitHub Projects** 보드를 쓰면 칸반으로 묶을 수 있다. 보드는 저장소 설정에서 수동 생성; 이슈·마일스톤과 자동 연동은 GitHub 문서를 따른다.

---

## 4. 에이전트(Cursor)에게 시킬 때

- **“열린 Studio 이슈부터 정리해”** → 터미널에서 `pnpm issues:studio` 실행 후 목록 기준으로 `Refs #N` 달고 PR.
- **“이슈 #42 구현해”** → `gh issue view 42`로 범위·Figma 링크 확인 후 코드.
- 부트스트랩 규칙: [`.cursor/rules/ai-session-bootstrap.mdc`](../.cursor/rules/ai-session-bootstrap.mdc) — `memory-bank` + 본 문서의 **원격 이슈 정렬**을 함께 고려.

---

## 5. 관련 링크

| 문서 | 내용 |
|------|------|
| [`.github/DESIGN.md`](../.github/DESIGN.md) | Studio 씬 렌더 Figma·라벨·sync 스크립트 |
| [`docs/AI_ORCHESTRATION.md`](./AI_ORCHESTRATION.md) | gstack ↔ Memory Bank |
| [`docs/design/QUALITY_PIPELINE.md`](./design/QUALITY_PIPELINE.md) | 디자인/엔지 리뷰 순서 |

---

## 6. 라벨·마일스톤 재생성

새 포크·조직에서 동일 메타가 필요하면:

`./.github/scripts/sync-scene-render-github-meta.sh`

( `gh` 인증 필요.)
