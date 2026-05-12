#!/usr/bin/env bash
# session-start.sh — Karpathy harness Phase 2 (W2 D2 Day 1)
#
# Loads filesystem memory at session start:
#   1. CLAUDE.md table of contents
#   2. .claude/skills/README.md skill list (name + first description line)
#   3. memory-bank/operations-mode-2026-q2.md table of contents
#   4. CLAUDE.md "Anti-patterns / Failure modes" section in full
#   5. Last 3 commits (SHA + subject)
#
# Invoke from .claude/settings.json on session-start event, or run manually:
#   bash .claude/hooks/session-start.sh
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$REPO_ROOT"

section() {
  printf '\n=== %s ===\n' "$1"
}

# 1. CLAUDE.md TOC
section "CLAUDE.md — table of contents"
if [[ -f CLAUDE.md ]]; then
  grep -E '^## ' CLAUDE.md || echo "(no top-level sections found)"
else
  echo "(CLAUDE.md not found)"
fi

# 2. Skill list
section ".claude/skills — registered skills"
if [[ -f .claude/skills/README.md ]]; then
  grep -E '^- |^### ' .claude/skills/README.md | head -40 || echo "(README empty)"
elif [[ -d .claude/skills ]]; then
  for skill_dir in .claude/skills/*/; do
    [[ -d "$skill_dir" ]] || continue
    skill_name="$(basename "$skill_dir")"
    skill_desc="$(grep -E '^description: ' "$skill_dir/SKILL.md" 2>/dev/null | head -1 | sed 's/^description: //')"
    printf '%s — %s\n' "$skill_name" "${skill_desc:-(no description)}"
  done
else
  echo "(.claude/skills not found)"
fi

# 3. operations-mode TOC
section "memory-bank/operations-mode-2026-q2.md — table of contents"
if [[ -f memory-bank/operations-mode-2026-q2.md ]]; then
  grep -E '^## ' memory-bank/operations-mode-2026-q2.md || echo "(no top-level sections)"
else
  echo "(operations-mode-2026-q2.md not found)"
fi

# 4. Anti-patterns section in full
section "CLAUDE.md — Anti-patterns / Failure modes (full)"
if [[ -f CLAUDE.md ]]; then
  awk '/^## Anti-patterns/{flag=1} flag && /^## /{if(seen) exit; seen=1; print; next} flag{print}' CLAUDE.md \
    || echo "(Anti-patterns section not found)"
else
  echo "(CLAUDE.md not found)"
fi

# 5. Last 3 commits
section "Recent commits"
git log -3 --pretty=format:'%h  %s' 2>/dev/null || echo "(not a git repo or no commits)"
echo
