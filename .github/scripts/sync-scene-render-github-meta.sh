#!/usr/bin/env bash
# Idempotent: creates labels and milestones for Studio scene-render workflow if missing.
# Requires: gh CLI, auth (`gh auth login`), run from repo root.
set -euo pipefail
REPO="${GITHUB_REPOSITORY:-$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || true)}"
if [[ -z "$REPO" ]]; then
  echo "Could not resolve repo. Run from elevate root with gh authenticated."
  exit 1
fi

echo "Using repo: $REPO"

declare -a LABELS=(
  "area/studio|5319E7|Studio / productions / dashboard"
  "type/feature|0E8A16|Implementation work"
  "type/figma|FBCA04|Design / Figma deliverable"
  "type/docs|0075CA|Documentation only"
  "priority/p0|B60205|P0 — cost visibility"
  "priority/p1|D93F0B|P1 — scene table & estimates"
  "priority/p2|F9D0C4|P2 — preflight & partial render UX"
  "priority/p3|C5DEF5|P3 — format presets & budget guard"
  "epic/scene-render|6F42C1|Epic: scene render cost & UX"
)

for entry in "${LABELS[@]}"; do
  IFS='|' read -r name color desc <<< "$entry"
  if gh label list --repo "$REPO" --json name -q ".[].name" 2>/dev/null | grep -qxF "$name"; then
    echo "Label exists: $name"
  else
    gh label create "$name" --repo "$REPO" --color "$color" --description "$desc"
    echo "Created label: $name"
  fi
done

declare -a MILESTONES=(
  "Scene render · P0|비용 가시성 — 예상 크레딧, 공식 단가 표시, 면책"
  "Scene render · P1|씬 테이블 + 합계 갱신, 씬별 추정"
  "Scene render · P2|실행 전 확인, 부분 렌더, 실패 가이드"
  "Scene render · P3|포맷별 프리셋, 예산 가드"
)

for entry in "${MILESTONES[@]}"; do
  IFS='|' read -r title desc <<< "$entry"
  exists=$(gh api "repos/$REPO/milestones" --jq ".[] | select(.title==\"$title\") | .title" 2>/dev/null || true)
  if [[ -n "$exists" ]]; then
    echo "Milestone exists: $title"
  else
    gh api "repos/$REPO/milestones" -f title="$title" -f description="$desc" -f state=open >/dev/null
    echo "Created milestone: $title"
  fi
done

echo "Done."
