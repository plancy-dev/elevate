# 개발 프로세스 — GitHub Issues · PR · Figma · gstack

이 문서는 **Elevate 저장소**에서 기능을 구현하거나 “다음에 할 일”을 볼 때의 **단일 절차**다.  
상위 원칙은 [`docs/AI_ORCHESTRATION.md`](./AI_ORCHESTRATION.md)(레이어 A→B→C)와 동일하며, 여기서는 **원격 이슈·디자인 링크·gh CLI**를 끼워 넣는다.

### 프롬프트 중심 운영 (수동 작업 최소화)

**목표:** 이슈·PR·검증·Figma 링크 정리는 **대화(프롬프트)로 에이전트에게 위임**하고, 사람이 직접 할 일은 **비밀·토큰만**으로 둔다.

| 당신이 할 일 (예외적으로) | 에이전트·툴이 할 일 |
|---------------------------|---------------------|
| `.env.local` / GitHub Secrets에 **API 토큰**만 유지 (커밋 금지) | `gh issue create` / 템플릿 필드 채움, `gh issue view`, 구현, `pnpm verify`, (선택) `pnpm figma:verify` |
| 토큰 만료 후 **갱신** (아래 §Figma 토큰) | 이슈 본문에 Figma·수락 기준 넣기, PR에 `Closes #N` |

**시작 예시 (한 줄씩 에이전트에게):**  
“`feature_task` 템플릿으로 이슈 만들고 Figma 프레임 URL이랑 수락 기준까지 채워 줘” / “이슈 #N 구현하고 PR 올려 줘 (`pnpm verify` 통과)” / “열린 Studio 이슈 목록 보고 다음 우선순위 제안해 줘 (`pnpm issues:studio` 또는 `gh`)”

GitHub 웹에서 버튼을 누르는 것은 **필수가 아니다.** `gh`와 Cursor가 대신할 수 있다.

**드라이런 완료 (기록):** Issue [#2](https://github.com/plancy-dev/elevate/issues/2) — 원격 이슈 → 브랜치 → PR (`Closes #2`) → `pnpm verify` 경로를 2026-04-17에 검증함.

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

1. **이슈** — 에이전트가 **`gh issue create`** 로 생성하거나, 웹에서 [`.github/ISSUE_TEMPLATE/feature_task.yml`](../.github/ISSUE_TEMPLATE/feature_task.yml) / [scene_render_task](../.github/ISSUE_TEMPLATE/scene_render_task.yml) 사용. 본문에 **프레임 단위 Figma URL** + **수락 기준**이 들어가야 한다.
2. **에픽·마일스톤** — 해당 시 [Epic #1](https://github.com/plancy-dev/elevate/issues/1) 또는 마일스톤 `Scene render · P0`–`P3`에 연결 (에이전트가 `gh`로 처리 가능).
3. **Figma** — 프레임 링크는 에이전트가 이슈·PR에 넣는다. 파일·라벨 SoT: [`.github/DESIGN.md`](../.github/DESIGN.md).
4. **gstack / 품질 파이프라인** — UI·제품 성격이면 [`docs/design/QUALITY_PIPELINE.md`](./design/QUALITY_PIPELINE.md) 순서(디자인 플랜 → 엔지 플랜 → 빌드 → verify).
5. **구현** — 브랜치 `issue-N-short-name`; PR 본문에 `Closes #N` 또는 `Refs #N`.
6. **검증** — 이 저장소는 **`pnpm verify`** 가 단일 게이트 (`package.json`).

### 2b. P0–P4 권장 게이트 (프롬프트 · 에이전트 · 툴)

품질 파이프라인 상세는 [`docs/design/QUALITY_PIPELINE.md`](./design/QUALITY_PIPELINE.md). 여기서는 **역할**만 고정한다.

| 단계 | 누가 | 무엇 | 비고 |
|------|------|------|------|
| **P0** | 에이전트 (프롬프트) | 이슈에 **프레임 단위 Figma URL** + **수락 기준** + (선택) 비범위 | 템플릿: [scene_render_task](../.github/ISSUE_TEMPLATE/scene_render_task.yml), [feature_task](../.github/ISSUE_TEMPLATE/feature_task.yml) |
| **P1** | 에이전트 | 구현 전 **`gh issue view N`** 로 범위·링크 확인 | 추측 구현 방지 |
| **P2** | 에이전트 | UI·레이아웃 변경 시 gstack **`/plan-design-review`** 또는 디자인 점검 스킬 (설치 시) | [`QUALITY_PIPELINE`](./design/QUALITY_PIPELINE.md) |
| **P3** | 에이전트 | PR 전 gstack **`/review`** (설치 시) — **권장** (필수 아님; 팀 속도와 트레이드오프) | 저장소 `pnpm verify`는 **항상** 유지 |
| **P4** | 툴 | (선택) **`pnpm figma:verify`** — Figma REST API로 파일 키 존재 확인 ([API](https://developers.figma.com/docs/rest-api/)); 토큰 없으면 스킵 | 로컬 또는 CI Secrets `FIGMA_ACCESS_TOKEN` |

**기본 정책:** Figma 검증은 **로컬·CI 모두 토큰 없으면 조용히 스킵**한다. CI에서 검증하려면 저장소에 `FIGMA_ACCESS_TOKEN` Secret을 등록한다.

### Figma 토큰·`FIGMA_VERIFY_FILE_KEYS`

- **`FIGMA_ACCESS_TOKEN`:** 개인 액세스 토큰(예: 90일 만료). **레포에 커밋하지 않는다.** 로컬은 `.env.local`(스크립트가 자동 로드), CI는 GitHub Actions Secret 동일 이름.
- **만료 “경고”:** 이 저장소는 **만료 N일 전 알림을 보내지 않는다.** 토큰이 무효·만료되면 `pnpm figma:verify`(및 CI에서 토큰을 쓰는 경우)가 **401/403으로 실패**하고, 스크립트가 **갱신하라는 메시지**를 출력한다 → 그때 Figma에서 새 토큰 발급 후 `.env.local` / Secret만 바꾸면 된다. (만료일은 Figma 토큰 화면에서 확인 가능.)
- **`FIGMA_VERIFY_FILE_KEYS`:** 임의 문자열이 아니라 **파일 URL의 키**다.  
  `https://www.figma.com/design/**여기가_파일_키**/파일이름` — 쉼표로 여러 개. **생략 시** 기본값은 [`.github/DESIGN.md`](../.github/DESIGN.md)에 있는 Studio 파일과 동일(스크립트 기본값). 다른 파일도 검증하려면 키를 추가한다.

### Figma 대표 프레임 — 누가 확정?

- **대표 프레임 URL**(`node-id=` 포함)은 **사람이** 확정한다. Figma에서 **Share → Copy link**로 복사하거나, `pnpm figma:list-links:frames`로 출력된 목록에서 **의도한 프레임**을 골라 [`.github/DESIGN.md`](../.github/DESIGN.md) 표·이슈에 붙인다.
- `pnpm figma:list-links:md`는 캔버스마다 **첫 FRAME** 기준 **후보 URL**만 만든다. 레이아웃이 여러 개면 반드시 사람이 대표를 지정한다.
- 초기 세팅·페이지 추가·마일스톤 변경 시에는 에이전트에게 “`DESIGN.md` 표와 이슈 #4–#9 맞춰 갱신해 줘”처럼 요청하면 된다.

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
