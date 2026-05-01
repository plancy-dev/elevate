import dotenv from "dotenv";
import { createAdminClient } from "@/lib/supabase/admin";
import { executeContentOpsRun } from "@/lib/content-ops/run-orchestrator";

dotenv.config({ path: ".env.local" });

type RunType = "ingest" | "draft_generate" | "review_gate" | "publish" | "publish_retry_failed";

type QueueRow = {
  id: string;
  type: string;
  status: string;
  title: string;
  metadata: Record<string, unknown> | null;
  review_notes: string | null;
};

async function runSequence(runTypes: readonly RunType[]) {
  const results: Array<{ runType: RunType; runId: string; status: string }> = [];
  for (const runType of runTypes) {
    const result = await executeContentOpsRun({
      runType,
      triggerType: "manual",
      metadata: {
        playbook: "content-ops-e2e-verification-playbook",
      },
    });
    results.push({
      runType,
      runId: result.runId,
      status: result.status,
    });
  }
  return results;
}

async function snapshotQueue() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("content_items")
    .select("id,type,status,title,metadata,review_notes")
    .in("status", ["draft", "review_required", "approved", "scheduled", "send_failed", "published"])
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    throw new Error(`queue_snapshot_failed:${error.message}`);
  }

  const rows = (data ?? []) as unknown as QueueRow[];
  const statusCount = rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = (acc[row.status] ?? 0) + 1;
    return acc;
  }, {});

  const sample = rows.slice(0, 5).map((row) => ({
    id: row.id,
    type: row.type,
    status: row.status,
    title: row.title,
    reviewNotes: row.review_notes,
    reviewGate:
      row.metadata && typeof row.metadata === "object"
        ? (row.metadata.review_gate as Record<string, unknown> | undefined)
        : undefined,
    packVersion:
      row.metadata && typeof row.metadata === "object"
        ? (row.metadata.generation_pack_version as string | undefined)
        : undefined,
  }));

  return {
    total: rows.length,
    statusCount,
    sample,
  };
}

async function run() {
  const step = process.argv[2];

  if (step === "generation") {
    const runs = await runSequence(["ingest", "draft_generate", "review_gate"]);
    const queue = await snapshotQueue();
    console.log(JSON.stringify({ step, runs, queue }, null, 2));
    return;
  }

  if (step === "publish") {
    const runs = await runSequence(["publish"]);
    const queue = await snapshotQueue();
    console.log(JSON.stringify({ step, runs, queue }, null, 2));
    return;
  }

  if (step === "retry") {
    const runs = await runSequence(["publish_retry_failed"]);
    const queue = await snapshotQueue();
    console.log(JSON.stringify({ step, runs, queue }, null, 2));
    return;
  }

  throw new Error("usage: pnpm tsx scripts/content-ops-e2e.ts <generation|publish|retry>");
}

run().catch((error) => {
  console.error("[content-ops-e2e] failed:", error);
  process.exit(1);
});
