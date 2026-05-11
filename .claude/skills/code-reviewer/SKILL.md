---
name: code-reviewer
description: Commit message verification and push readiness check for elevate repo. Use when reviewing staged changes before commit, when verifying commit message convention (no Co-Authored-By in elevate per repo convention; ADR refs in footer), when checking pre-commit scope (file targeting + exclusion), or when verifying push state diff (local vs origin/main) before push-ready ping or direct push.
allowed-tools: Read, Glob, Grep, Bash
---

# Code Reviewer — Commit + Push Readiness

## When to invoke

- A commit is being prepared and the message needs convention check.
- Staged changes need scope verification (only intended files staged; no accidental inclusions).
- Push readiness check before `git push origin main` or before founder push-ready ping.
- Pre-commit hook fails and root cause needs diagnosis.

## What to do

### Commit message verification

1. **Subject line** — imperative, concise, capitalized first word. Reference ADR if applicable: `ADR-015: Elevate Content Product Design (Essays + Studio Dispatch)`.
2. **Body** — explain *why* (rationale, scope, side effects), not *what* (diff shows that). Mechanism, not narrative.
3. **Footer** — `Reference: ADR-XXX, ADR-YYY` for ADR-driven commits. Verify every cited ADR exists in `docs/adr/` (no dangling references in commit history — commits are immutable).
4. **No Co-Authored-By** — elevate repo convention. Confirmed by recent commits (a391007 onward, 045f2b8, 88b95b1, 806964a).
5. **No `--no-verify`** — pre-commit hooks (lint-staged) must pass. Bypass forbidden per `AGENTS.md` § Cursor Cloud specific instructions.

### Staged scope verification

1. `git status --short` — confirm only intended files are staged (`M` modified, `A` added). Untracked `??` files NOT auto-staged.
2. `git diff --cached --stat` — verify line count matches commission scope.
3. For multi-file commits — explicit `git add <path>` per file. Never `git add -A` or `git add .` for content/docs commits (risk: untracked secrets, drafts).
4. Cross-check working tree untracked files — surface to founder if any look like they should be in this commit or a separate one.

### Push readiness check

1. `git fetch origin main` — sync local tracking ref.
2. `git log origin/main -1 --oneline` — confirm origin head.
3. `git rev-list --left-right --count origin/main...main` — verify expected ahead/behind count.
4. Direct push to main triggers Vercel production auto-deploy — never push without explicit commission.
5. Harness BLOCK rule may apply on default-branch pushes; if blocked, prepare push-ready ping for founder with commit SHAs.

### Pre-commit hook diagnosis (if fail)

1. `lint-staged` ESLint runs on `.ts/.tsx/.js/.jsx`. Markdown/MDX edits typically produce: `lint-staged could not find any staged files matching configured tasks.` — this is **expected** for content-only commits, not a failure.
2. If real lint failure (TypeScript / ESLint error on staged code file):
   - Read the error output.
   - Fix the source (not the lint config).
   - Re-stage the fixed file.
   - Create a **new commit** — pre-commit failure means the commit did *not* happen, so `--amend` would modify the previous commit and destroy work.

### Commit message scaffold (HEREDOC pattern)

```bash
git commit -m "$(cat <<'EOF'
Subject line: imperative, concise

Body paragraph: why this change, what it enables, what risks
remain. Mechanism, not narrative.

Reference: ADR-XXX, ADR-YYY
EOF
)"
```

## References

- `AGENTS.md` § Cursor Cloud specific instructions (Husky pre-commit, sharp rebuild, gotchas)
- `CLAUDE.md` § Skill routing (Repository rules win — hooks not bypassable)
- `docs/DEV_PROCESS_GITHUB.md` (issues ↔ PR ↔ gstack process if applicable)
- Recent commits as convention exemplars: `9469a8b`, `a391007`, `045f2b8`, `cf380eb`, `88b95b1`, `806964a`, `9d2917a`

## Out of scope

- ADR drafting (use `strategic-architect`)
- Push action when harness-blocked (founder manual push)
- Vercel deploy verification post-push (separate ops concern)
- Branch / PR workflows (current convention: direct main commits + Vercel auto-deploy)
