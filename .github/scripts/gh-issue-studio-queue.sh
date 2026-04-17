#!/usr/bin/env bash
# Lists open Studio-tagged GitHub issues and the scene-render epic (remote).
set -euo pipefail
cd "$(dirname "$0")/../.."
REPO="$(./.github/scripts/gh-repo.sh)"

echo "Repository: $REPO"
echo ""
echo "=== Open issues · label: area/studio ==="
gh issue list --repo "$REPO" --label area/studio --state open --limit 50 || true
echo ""
echo "=== Issues · label: epic/scene-render (recent) ==="
gh issue list --repo "$REPO" --label epic/scene-render --state all --limit 20 || true
echo ""
echo "=== Milestone: Scene render · P0 (open) ==="
gh issue list --repo "$REPO" --milestone "Scene render · P0" --state open --limit 30 || true
echo ""
echo "Epic: gh issue view 1 --repo $REPO --web"
echo "    : https://github.com/$REPO/issues/1"
