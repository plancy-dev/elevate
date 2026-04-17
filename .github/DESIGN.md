# Design · Studio · Scene render

Single place for **Figma** links and design↔engineering workflow for the Studio scene render (Runway) track.

**Process hub (Issues · PR · gh · gstack):** [`docs/DEV_PROCESS_GITHUB.md`](../docs/DEV_PROCESS_GITHUB.md)

## Figma file

| Resource | Link |
|----------|------|
| **File (canonical)** | [Elevate · Studio · Scene render](https://www.figma.com/design/qxCqUDg8XcC3bEwuR2ImwV/Elevate-%C2%B7-Studio-%C2%B7-Scene-render) |

**Pages (recommended structure)**

- **P0 Cost** — 비용 요약 카드, 예상 크레딧, 면책 문구
- **P1 Scene table** — 씬 테이블 밀도, 씬별 예상 비용
- **P2 Preflight** — 실행 전 확인, 부분 렌더, 실패 안내
- **P3 Format and budget** — 포맷 프리셋, 예산 가드
- **Explorations** — 실험·대안 레이아웃

> Tip: Link a specific frame in GitHub issues with *Share → Copy link* on the frame (URL will include `node-id=`).  
> **Automation:** with `FIGMA_ACCESS_TOKEN` in `.env.local`, run `pnpm figma:list-links` (Markdown table) or `pnpm figma:list-links --frames` (every frame URL) — no manual `node-id` extraction.

## Figma backlog (GitHub)

Epic: [#1 — Studio · Scene render · cost & UX](https://github.com/plancy-dev/elevate/issues/1).  
아래 이슈에 **문장형 수락 기준**이 있으며, **대표 프레임 URL은 사람이 확정**한다 ([`docs/DEV_PROCESS_GITHUB.md`](../docs/DEV_PROCESS_GITHUB.md) §Figma 대표 프레임). 진행 스냅샷: [`docs/design/SCENE_RENDER_EPIC_STATUS.md`](../docs/design/SCENE_RENDER_EPIC_STATUS.md). DESIGN.md 표 동기화 이슈 [#10](https://github.com/plancy-dev/elevate/issues/10)은 처리 완료(표가 SoT).

| Phase | GitHub issue | Representative frame |
|-------|----------------|--------------------------------------------------|
| Foundation — pages & cover | [#4](https://github.com/plancy-dev/elevate/issues/4) | [File](https://www.figma.com/design/qxCqUDg8XcC3bEwuR2ImwV/Elevate-%C2%B7-Studio-%C2%B7-Scene-render) · [P0 Cost page](https://www.figma.com/design/qxCqUDg8XcC3bEwuR2ImwV/Elevate-%C2%B7-Studio-%C2%B7-Scene-render?node-id=0-1) |
| P0 Cost | [#5](https://github.com/plancy-dev/elevate/issues/5) | [P0 Cost](https://www.figma.com/design/qxCqUDg8XcC3bEwuR2ImwV/Elevate-%C2%B7-Studio-%C2%B7-Scene-render?node-id=0-1) |
| P1 Scene table | [#6](https://github.com/plancy-dev/elevate/issues/6) | [P1 Scene table](https://www.figma.com/design/qxCqUDg8XcC3bEwuR2ImwV/Elevate-%C2%B7-Studio-%C2%B7-Scene-render?node-id=1-2) |
| P2 Preflight | [#7](https://github.com/plancy-dev/elevate/issues/7) | [P2 Preflight](https://www.figma.com/design/qxCqUDg8XcC3bEwuR2ImwV/Elevate-%C2%B7-Studio-%C2%B7-Scene-render?node-id=11-2) |
| P3 Format & budget | [#8](https://github.com/plancy-dev/elevate/issues/8) | [P3 Format and budget](https://www.figma.com/design/qxCqUDg8XcC3bEwuR2ImwV/Elevate-%C2%B7-Studio-%C2%B7-Scene-render?node-id=11-3) |
| Explorations | [#9](https://github.com/plancy-dev/elevate/issues/9) | [Explorations](https://www.figma.com/design/qxCqUDg8XcC3bEwuR2ImwV/Elevate-%C2%B7-Studio-%C2%B7-Scene-render?node-id=1-3) |
| DESIGN.md ↔ Figma (메타) | [#10](https://github.com/plancy-dev/elevate/issues/10) (closed) | 표 본문이 최종 SoT — 재동기화 시 PR + 필요 시 이슈 재오픈 |

**Product (code, separate from Figma frames):** estimated Runway credits before scene render — [#12](https://github.com/plancy-dev/elevate/issues/12).

## GitHub workflow (this repo)

- **Milestones:** `Scene render · P0` … `Scene render · P3` — group issues by delivery phase.
- **Labels:** `area/studio`, `type/feature` | `type/figma` | `type/docs`, `priority/p0` … `priority/p3`, `epic/scene-render`.
- **PRs:** In the PR description, use `Closes #N` / `Refs #N` to tie work to issues.
- **Tracking:** [Epic #1 — Studio · Scene render · cost & UX (P0–P3)](https://github.com/plancy-dev/elevate/issues/1)
- **Bootstrap / re-sync labels & milestones** (requires [`gh`](https://cli.github.com/) auth): run from repo root  
  `./.github/scripts/sync-scene-render-github-meta.sh`

## Related product docs

- [`docs/design/DASHBOARD_UX_PRINCIPLES.md`](../docs/design/DASHBOARD_UX_PRINCIPLES.md)
- [`docs/design/SYSTEM.md`](../docs/design/SYSTEM.md)
