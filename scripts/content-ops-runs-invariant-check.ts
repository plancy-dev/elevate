import dotenv from "dotenv";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeAutomationHeartbeat } from "@/lib/content-ops/automation-heartbeat";

dotenv.config({ path: ".env.local", quiet: true });

const LOOKBACK_HOURS = Number.parseInt(
  process.env.CONTENT_OPS_RUNS_INVARIANT_LOOKBACK_HOURS ?? "168",
  10,
);

const CONSECUTIVE_WINDOW_DAYS = Number.parseInt(
  process.env.CONTENT_OPS_RUNS_INVARIANT_CONSECUTIVE_WINDOW_DAYS ?? "14",
  10,
);

function computeConsecutiveScheduledUtcStats(
  rows: { trigger_type: string; created_at: string }[],
  nowMs: number,
  windowDays: number,
) {
  const windowMs = windowDays * 24 * 60 * 60 * 1000;
  const cutoffMs = nowMs - windowMs;
  const scheduledRows = rows.filter((r) => {
    if (r.trigger_type !== "scheduled") return false;
    const t = Date.parse(r.created_at);
    return Number.isFinite(t) && t >= cutoffMs;
  });
  const daySet = new Set<string>();
  for (const r of scheduledRows) {
    daySet.add(new Date(Date.parse(r.created_at)).toISOString().slice(0, 10));
  }
  const scheduledDaysUtc = [...daySet].sort();
  let maxConsecutive = 0;
  if (scheduledDaysUtc.length > 0) {
    let streak = 1;
    maxConsecutive = 1;
    for (let i = 1; i < scheduledDaysUtc.length; i++) {
      const a = Date.parse(`${scheduledDaysUtc[i - 1]!}T00:00:00.000Z`);
      const b = Date.parse(`${scheduledDaysUtc[i]!}T00:00:00.000Z`);
      if ((b - a) / 86_400_000 === 1) {
        streak += 1;
        maxConsecutive = Math.max(maxConsecutive, streak);
      } else {
        streak = 1;
      }
    }
  }
  return {
    queryWindowDays: windowDays,
    scheduledDaysUtc,
    scheduledRunCountInWindow: scheduledRows.length,
    maxConsecutiveUtcDaysWithScheduled: maxConsecutive,
    meetsSevenConsecutiveCalendarDays: maxConsecutive >= 7,
    note: "Distinct UTC calendar days with ≥1 content_runs where trigger_type=scheduled; max streak counts consecutive days in sorted list.",
  };
}

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

  const windowDays =
    Number.isFinite(CONSECUTIVE_WINDOW_DAYS) && CONSECUTIVE_WINDOW_DAYS > 0
      ? CONSECUTIVE_WINDOW_DAYS
      : 14;
  const consecutiveScheduledDaysUtc = computeConsecutiveScheduledUtcStats(rows, Date.now(), windowDays);

  const payload = {
    generatedAt: new Date().toISOString(),
    command: "pnpm run content-ops:runs-invariant-check",
    lookbackHours,
    heartbeat,
    runsInvariant: verdict,
    consecutiveScheduledDaysUtc,
  };

  console.log(JSON.stringify(payload, null, 2));
}

main().catch((e) => {
  console.error("[content-ops-runs-invariant-check] failed:", e);
  process.exit(1);
});
