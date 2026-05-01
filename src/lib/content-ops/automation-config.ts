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
