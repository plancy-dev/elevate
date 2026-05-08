#!/usr/bin/env bash
# One-click gate close helper for issue #51.
# - Runs gate51 multi-day trend check
# - Runs global gate check
# - Closes GitHub issue #51 when both checks report PASS
# - Otherwise posts a PENDING status comment and keeps the issue open

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v gh >/dev/null 2>&1; then
  echo "error: GitHub CLI (gh) is required." >&2
  exit 1
fi

echo "→ running #51 trend check"
TREND_OUT="$(pnpm run -s content-ops:gate51-trend-check)"
echo "$TREND_OUT" > /tmp/gate51-trend-check.out

echo "→ running global gate check"
GATE_OUT="$(pnpm run content-ops:gate-check)"
echo "$GATE_OUT" > /tmp/gate-check.out

TREND_PASS=false
GATE51_PASS=false

if echo "$TREND_OUT" | grep -q '"status": "PASS"'; then
  TREND_PASS=true
fi

if echo "$GATE_OUT" | grep -A8 '"gate51"' | grep -q '"status": "PASS"'; then
  GATE51_PASS=true
fi

if [[ "$TREND_PASS" == "true" && "$GATE51_PASS" == "true" ]]; then
  echo "→ #51 PASS detected, closing issue"
  gh issue close 51 --comment "$(cat <<'EOF'
#51 gate close (multi-day trend) — PASS

- Command: `pnpm run content-ops:gate51-trend-check`
- Command: `pnpm run content-ops:gate-check`
- Result: `gate51=PASS`

Evidence files:
- `/tmp/gate51-trend-check.out`
- `/tmp/gate-check.out`

Closure rationale:
- Multi-day trend confirmation satisfied.
- Novelty recovery signal is stable enough for operational closure.
EOF
)"
  echo "✓ #51 closed"
  exit 0
fi

echo "→ #51 is still pending, posting status comment"
gh issue comment 51 --body "$(cat <<'EOF'
#51 gate recheck — PENDING

- Command: `pnpm run content-ops:gate51-trend-check`
- Command: `pnpm run content-ops:gate-check`
- Result: `gate51=PENDING`

Blocker:
- Multi-day trend condition is not yet fully satisfied.

Next action:
- Re-run the same checks in the next daily window.
EOF
)"

echo "⏸ #51 kept open (pending)."
