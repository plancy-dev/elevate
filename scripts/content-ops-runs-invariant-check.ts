import dotenv from "dotenv";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeAutomationHeartbeat } from "@/lib/content-ops/automation-heartbeat";

dotenv.config({ path: ".env.local" });

const LOOKBACK_HOURS = Number.parseInt(
  process.env.CONTENT_OPS_RUNS_INVARIANT_LOOKBACK_HOURS ?? "168",
  10,
);

function runsInvariantVerdict(params: {
  rowCount: number;
  level: string;
  manualOnlyPath: boolean;
  scheduledWithoutAutomationSource: number;
  scheduledTriggerCount: number;
}): { status: "PASS" | "WARN" | "FAIL"; reason: string } {
  if (params.rowCount === 0) {
    return { status: "FAIL", reason: "no_content_runs_in_lookback_window" };
  }
  if (params.level === "red") {
    return { status: "FAIL", reason: "automation_heartbeat_red_telemetry_stale_or_missing" };
  }
  if (params.manualOnlyPath) {
    return {
      status: "WARN",
      reason: "manual_or_api_only_no_scheduled_in_window_cursor_first_may_be_expected",
    };
  }
  if (params.scheduledTriggerCount > 0 && params.scheduledWithoutAutomationSource > 0) {
    return {
      status: "WARN",
      reason: "some_scheduled_rows_missing_metadata_automation_source",
    };
  }
  if (params.level === "yellow") {
    return { status: "WARN", reason: "automation_heartbeat_yellow_review_idle_vs_stuck" };
  }
  return { status: "PASS", reason: "runs_and_heartbeat_within_expected_bounds" };
}

async function main() {
  const lookbackHours = Number.isFinite(LOOKBACK_HOURS) && LOOKBACK_HOURS > 0 ? LOOKBACK_HOURS : 168;
  const admin = createAdminClient();
  const since = new Date(Date.now() - lookbackHours * 60 * 60 * 1000).toISOString();
  const { data, error } = await admin
    .from("content_runs")
    .select("trigger_type, created_at, metadata")
    .gte("created_at", since)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`content_runs_query_failed:${error.message}`);

  const rows = data ?? [];
  const heartbeat = computeAutomationHeartbeat(rows, Date.now(), { lookbackHours });
  const scheduledTriggerCount = heartbeat.countsByTrigger.scheduled ?? 0;
  const verdict = runsInvariantVerdict({
    rowCount: heartbeat.rowCount,
    level: heartbeat.level,
    manualOnlyPath: heartbeat.manualOnlyPath,
    scheduledWithoutAutomationSource: heartbeat.scheduledWithoutAutomationSource,
    scheduledTriggerCount,
  });

  console.log(
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        lookbackHours,
        heartbeat,
        runsInvariant: verdict,
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error("[content-ops-runs-invariant-check] failed:", e);
  process.exit(1);
});
