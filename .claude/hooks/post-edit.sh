#!/usr/bin/env bash
# post-edit.sh — Karpathy harness Phase 2 (W2 D2 Day 1)
#
# Runs after Write/Edit tool use. Auto-formats and lints the edited file.
#   - Prettier on .ts / .tsx / .js / .jsx / .md / .json / .mdx
#   - ESLint on .ts / .tsx / .js / .jsx
#
# Invoke from .claude/settings.json on post-tool-use(Write|Edit) with $1 = file path.
#   bash .claude/hooks/post-edit.sh path/to/file.ts
set -euo pipefail

FILE="${1:-}"
if [[ -z "$FILE" ]]; then
  echo "post-edit: no file argument provided — skipping" >&2
  exit 0
fi

if [[ ! -f "$FILE" ]]; then
  echo "post-edit: $FILE not found — skipping" >&2
  exit 0
fi

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$REPO_ROOT"

ext="${FILE##*.}"
prettier_exts=(ts tsx js jsx md mdx json)
eslint_exts=(ts tsx js jsx)

matches() {
  local needle="$1"; shift
  for hay in "$@"; do [[ "$hay" == "$needle" ]] && return 0; done
  return 1
}

prettier_ran=false
eslint_ran=false

if matches "$ext" "${prettier_exts[@]}"; then
  if command -v pnpm >/dev/null 2>&1 && [[ -f package.json ]]; then
    if pnpm exec prettier --write "$FILE" 2>/dev/null; then
      prettier_ran=true
    fi
  fi
fi

if matches "$ext" "${eslint_exts[@]}"; then
  if command -v pnpm >/dev/null 2>&1 && [[ -f package.json ]]; then
    if pnpm exec eslint --fix "$FILE" 2>/dev/null; then
      eslint_ran=true
    fi
  fi
fi

printf 'post-edit %s: prettier=%s eslint=%s\n' "$FILE" "$prettier_ran" "$eslint_ran"
