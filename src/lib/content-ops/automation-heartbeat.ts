import type { Json } from "@/types/database.types";

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export type AutomationHeartbeatInputRow = {
  trigger_type: string;
  created_at: string;
  metadata: Json | null;
};

export type AutomationHeartbeatLevel = "green" | "yellow" | "red";

export type AutomationHeartbeatResult = {
  level: AutomationHeartbeatLevel;
  lookbackHours: number;
  rowCount: number;
  lastAnyRunAt: string | null;
  hoursSinceAny: number | null;
  lastScheduledRunAt: string | null;
  hoursSinceScheduled: number | null;
  countsByTrigger: Record<string, number>;
  scheduledByAutomationSource: Record<string, number>;
  manualOnlyPath: boolean;
  scheduledWithoutAutomationSource: number;
};

function hoursBetween(iso: string | null, nowMs: number): number | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return null;
  return Math.floor((nowMs - ms) / (60 * 60 * 1000));
}

function maxIso(a: string | null, b: string): string {
  if (!a) return b;
  return Date.parse(a) >= Date.parse(b) ? a : b;
}

export function computeAutomationHeartbeat(
  rows: AutomationHeartbeatInputRow[],
  nowMs: number,
  params: { lookbackHours: number },
): AutomationHeartbeatResult {
  const lookbackHours = params.lookbackHours;
  let lastAny: string | null = null;
  let lastScheduled: string | null = null;
  const countsByTrigger: Record<string, number> = {};
  const scheduledByAutomationSource: Record<string, number> = {};
  let scheduledWithoutAutomationSource = 0;

  for (const row of rows) {
    const trig = row.trigger_type || "unknown";
    countsByTrigger[trig] = (countsByTrigger[trig] ?? 0) + 1;
    lastAny = maxIso(lastAny, row.created_at);
    if (trig === "scheduled") {
      lastScheduled = maxIso(lastScheduled, row.created_at);
      const meta = asObject(row.metadata);
      const src =
        typeof meta?.automation_source === "string" ? meta.automation_source.trim() : "";
      if (src) {
        scheduledByAutomationSource[src] = (scheduledByAutomationSource[src] ?? 0) + 1;
      } else {
        scheduledWithoutAutomationSource += 1;
      }
    }
  }

  const hoursSinceAny = hoursBetween(lastAny, nowMs);
  const hoursSinceScheduled = hoursBetween(lastScheduled, nowMs);
  const scheduledTotal = countsByTrigger.scheduled ?? 0;
  const manualTotal =
    (countsByTrigger.manual ?? 0) + (countsByTrigger.api ?? 0) + (countsByTrigger.retry ?? 0);
  const manualOnlyPath = scheduledTotal === 0 && manualTotal > 0 && rows.length > 0;

  let level: AutomationHeartbeatLevel;
  if (rows.length === 0 || hoursSinceAny === null) {
    level = "red";
  } else if (hoursSinceAny > 168) {
    level = "red";
  } else if (hoursSinceAny > 72) {
    level = "yellow";
  } else if (manualOnlyPath) {
    level = "yellow";
  } else {
    level = "green";
  }

  return {
    level,
    lookbackHours,
    rowCount: rows.length,
    lastAnyRunAt: lastAny,
    hoursSinceAny,
    lastScheduledRunAt: lastScheduled,
    hoursSinceScheduled,
    countsByTrigger,
    scheduledByAutomationSource,
    manualOnlyPath,
    scheduledWithoutAutomationSource,
  };
}
