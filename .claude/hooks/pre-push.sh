#!/usr/bin/env bash
# pre-push.sh — Karpathy harness Phase 2 (W2 D2 Day 1)
#
# Blocks push if any guard fails:
#   1. Test suite fails (pnpm test, if defined in package.json)
#   2. Any unpushed commit contains "Co-Authored-By" (elevate convention violation)
#   3. Any unpushed commit message indicates --no-verify was used
#
# Invoke from .claude/settings.json on pre-push event, or wire via husky/git hook.
#   bash .claude/hooks/pre-push.sh
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$REPO_ROOT"

fail() {
  echo "pre-push BLOCKED: $1" >&2
  exit 1
}

# Determine unpushed commit range (vs upstream tracking branch).
upstream="$(git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null || echo '')"
if [[ -n "$upstream" ]]; then
  range="${upstream}..HEAD"
else
  range="HEAD"
fi

# 1. Tests (only if package.json defines a test script).
if [[ -f package.json ]] && grep -qE '"test"[[:space:]]*:' package.json; then
  if command -v pnpm >/dev/null 2>&1; then
    echo "pre-push: running pnpm test on $range"
    if ! pnpm test --silent; then
      fail "pnpm test failed"
    fi
  else
    echo "pre-push: pnpm not on PATH — skipping test guard" >&2
  fi
else
  echo "pre-push: no test script in package.json — skipping test guard"
fi

# 2. Co-Authored-By guard (elevate convention: NEVER).
if git log "$range" --format='%B' 2>/dev/null | grep -qi 'Co-Authored-By'; then
  offenders="$(git log "$range" --format='%h %s' --grep='Co-Authored-By' -i)"
  fail "Co-Authored-By found in unpushed commits — elevate convention violation:\n${offenders}"
fi

# 3. --no-verify heuristic: commits whose message explicitly notes a hook bypass.
if git log "$range" --format='%B' 2>/dev/null | grep -qiE 'no[-_ ]verify|bypass[- ]?hook|skip[- ]?hook'; then
  fail "Unpushed commits reference --no-verify / hook bypass — investigate before pushing"
fi

echo "pre-push: all guards passed for $range"
