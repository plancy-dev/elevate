import path from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import dotenv from "dotenv";
import { buildContentQualitySnapshot } from "@/lib/content-ops/quality-monitor";
import { createAdminClient } from "@/lib/supabase/admin";

dotenv.config({ path: ".env.local" });

const FORCE = process.argv.includes("--force");

function resolveUtcDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

async function readJsonSafe(filePath: string): Promise<Record<string, unknown> | null> {
  try {
    const raw = await readFile(filePath, "utf-8");
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function main() {
  const now = new Date();
  const dateKey = resolveUtcDateKey(now);
  const reportDir = path.resolve(process.cwd(), "reports/content-ops/daily");
  const reportPath = path.join(reportDir, `${dateKey}.json`);

  await mkdir(reportDir, { recursive: true });
  if (!FORCE) {
    const existing = await readJsonSafe(reportPath);
    if (existing) {
      console.log(
        JSON.stringify(
          {
            ok: true,
            skipped: true,
            reason: "snapshot_already_exists",
            reportPath,
          },
          null,
          2,
        ),
      );
      return;
    }
  }

  const admin = createAdminClient();
  const dayStartIso = `${dateKey}T00:00:00.000Z`;
  const dayEndIso = `${dateKey}T23:59:59.999Z`;
  const existingRun = await admin
    .from("content_runs")
    .select("id")
    .eq("run_type", "review_gate")
    .contains("metadata", { snapshot_kind: "daily_ops" })
    .gte("created_at", dayStartIso)
    .lte("created_at", dayEndIso)
    .limit(1)
    .maybeSingle();
  if (!FORCE && existingRun.data?.id) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          skipped: true,
          reason: "daily_snapshot_run_exists",
          runId: existingRun.data.id,
        },
        null,
        2,
      ),
    );
    return;
  }

  const [itemsRes, runsRes] = await Promise.all([
    admin
      .from("content_items")
      .select("id,type,title,status,created_at,updated_at,review_notes,metadata")
      .order("created_at", { ascending: false })
      .limit(1000),
    admin
      .from("content_runs")
      .select("run_type,status,created_at,error_summary,metadata")
      .order("created_at", { ascending: false })
      .limit(1000),
  ]);

  if (itemsRes.error) throw new Error(`snapshot_items_query_failed:${itemsRes.error.message}`);
  if (runsRes.error) throw new Error(`snapshot_runs_query_failed:${runsRes.error.message}`);

  const snapshot = buildContentQualitySnapshot({
    items: (itemsRes.data ?? []) as never[],
    runs: (runsRes.data ?? []) as never[],
    windowDays: 7,
    freshWindowHours: 24,
  });

  const report = {
    generatedAt: now.toISOString(),
    dateKey,
    source: "content-ops-daily-snapshot",
    runtime: process.env.CONTENT_OPS_AUTOMATION_RUNTIME ?? "cursor",
    summary: {
      generatedCount: snapshot.generatedCount,
      publishedCount: snapshot.publishedCount,
      reviewRequiredCount: snapshot.reviewRequiredCount,
      sendFailedCount: snapshot.sendFailedCount,
      deferredCount: snapshot.deferredCount,
      avgQualityScore: snapshot.avgQualityScore,
      citationCoverage7dAvg: snapshot.citationCoverage7dAvg,
      citationCoverage24hAvg: snapshot.citationCoverage24hAvg,
      winnerStrategy: snapshot.winnerStrategy,
    },
    strategyScoreboard: snapshot.strategyScoreboard,
    topQualityIssues: snapshot.topQualityIssues,
    topPublishFailureReasons: snapshot.topPublishFailureReasons,
  };

  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf-8");
  const runInsert = await admin
    .from("content_runs")
    .insert({
      run_type: "review_gate",
      status: "succeeded",
      trigger_type: "manual",
      started_at: now.toISOString(),
      ended_at: now.toISOString(),
      metadata: {
        snapshot_kind: "daily_ops",
        daily_snapshot: report,
      },
    })
    .select("id")
    .single();
  if (runInsert.error) {
    throw new Error(`daily_snapshot_run_insert_failed:${runInsert.error.message}`);
  }
  console.log(
    JSON.stringify(
      {
        ok: true,
        runId: runInsert.data?.id ?? null,
        reportPath,
        dateKey,
        generatedAt: report.generatedAt,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("[content-ops-daily-snapshot] failed:", error);
  process.exit(1);
});
