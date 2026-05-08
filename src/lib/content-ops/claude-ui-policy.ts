/**
 * Admin content queue — Claude UI when review gate already passed.
 * Server-only env (not NEXT_PUBLIC): read in Server Components and pass as prop to client trees.
 *
 * Default `true`: show Advanced Claude block when `gatePassed === true`.
 * Set `CONTENT_OPS_CLAUDE_WHEN_GATE_PASSED=false` to hide it (operator policy).
 */
export function parseContentOpsClaudeWhenGatePassedEnabled(
  raw: string | undefined,
): boolean {
  if (raw === undefined || raw === "") return true;
  const v = raw.trim().toLowerCase();
  return v !== "false" && v !== "0" && v !== "no";
}

export function getContentOpsClaudeWhenGatePassedEnabled(): boolean {
  return parseContentOpsClaudeWhenGatePassedEnabled(
    process.env.CONTENT_OPS_CLAUDE_WHEN_GATE_PASSED,
  );
}
