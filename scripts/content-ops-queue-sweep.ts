/**
 * Operator maintenance: re-score queue, triage, structural rewrite, re-score, triage.
 * Run after content-ops-queue-dedupe-by-title.ts when clearing review_required backlog.
 *
 * pnpm exec tsx scripts/content-ops-queue-sweep.ts
 */
import dotenv from "dotenv";
import { executeContentOpsRun } from "@/lib/content-ops/run-orchestrator";

dotenv.config({ path: ".env.local", quiet: true });

async function main() {
  const rounds: Array<
    | "review_gate"
    | "queue_triage"
    | "queue_rewrite"
  > = ["review_gate", "queue_triage", "queue_rewrite", "review_gate", "queue_triage"];

  const results: unknown[] = [];
  for (const runType of rounds) {
    const r = await executeContentOpsRun({
      runType,
      triggerType: "manual",
      initiatedBy: null,
      metadata: { script: "content-ops-queue-sweep" },
    });
    results.push({ runType, runId: r.runId, status: r.status });
  }

  console.log(JSON.stringify({ ok: true, rounds: results }, null, 2));
}

main().catch((e) => {
  console.error("[content-ops-queue-sweep] failed:", e);
  process.exit(1);
});
