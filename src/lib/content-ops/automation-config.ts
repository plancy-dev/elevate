export type ContentOpsAutomationRuntime = "cursor" | "vercel-cron";

export type ContentOpsRunType =
  | "ingest"
  | "draft_generate"
  | "review_gate"
  | "publish"
  | "publish_retry_failed";

export const CONTENT_OPS_RUNTIME: ContentOpsAutomationRuntime =
  process.env.CONTENT_OPS_AUTOMATION_RUNTIME === "vercel-cron"
    ? "vercel-cron"
    : "cursor";

export const CONTENT_OPS_RUN_SEQUENCE: readonly ContentOpsRunType[] = [
  "ingest",
  "draft_generate",
  "publish",
];

export const CONTENT_OPS_US_ET_SCHEDULE = {
  timezone: "America/New_York",
  dailyGeneration: ["08:30:00", "08:40:00", "08:50:00"],
  publishWindow: "11:00:00",
  retryWindow: "14:30:00",
  weeklyLongformBoostDays: ["Tue", "Thu"] as const,
  weeklyLongformBoostTime: "10:00:00",
} as const;

export function isRuntimeEnabledForSource(source: "cursor" | "vercel-cron"): boolean {
  if (CONTENT_OPS_RUNTIME === "cursor") {
    return source === "cursor";
  }
  return source === "vercel-cron";
}

export function resolveRuntimeMismatchRule(source: "cursor" | "vercel-cron"): {
  mismatched: boolean;
  reason: string;
  nextAction: string;
} {
  const enabled = isRuntimeEnabledForSource(source);
  if (enabled) {
    return { mismatched: false, reason: "runtime_match", nextAction: "continue" };
  }
  return {
    mismatched: true,
    reason: `runtime_secret_mismatch:${CONTENT_OPS_RUNTIME}:source=${source}`,
    nextAction:
      CONTENT_OPS_RUNTIME === "cursor"
        ? "Use source=cursor and verify CONTENT_OPS_AUTOMATION_RUNTIME/caller token alignment."
        : "Use source=vercel-cron and verify cron token/header/runtime alignment.",
  };
}
