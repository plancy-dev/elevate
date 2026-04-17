# Design · Studio · Scene render

Single place for **Figma** links and design↔engineering workflow for the Studio scene render (Runway) track.

## Figma file

| Resource | Link |
|----------|------|
| **File (canonical)** | [Elevate · Studio · Scene render](https://www.figma.com/design/qxCQUDg8XcCBewuR2lmwV/Elevate---Studio---Scene-render) |

**Pages (recommended structure)**

- **P0 Cost** — 비용 요약 카드, 예상 크레딧, 면책 문구
- **P1 Scene table** — 씬 테이블 밀도, 씬별 예상 비용
- **Explorations** — 실험·대안 레이아웃

> Tip: Link a specific frame in GitHub issues with *Share → Copy link* on the frame (URL will include `node-id=`).

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
