export type ContentOpsAutomationRuntime = "cursor" | "vercel-cron";
export type ContentOpsAutomationSource = "cursor" | "vercel-cron";

export type ContentOpsRunType =
  | "ingest"
  | "draft_generate"
  | "review_gate"
  | "queue_triage"
  | "queue_rewrite"
  | "publish"
  | "publish_retry_failed";

export const CONTENT_OPS_RUNTIME: ContentOpsAutomationRuntime =
  process.env.CONTENT_OPS_AUTOMATION_RUNTIME === "vercel-cron"
    ? "vercel-cron"
    : "cursor";

// Cursor-first policy: keep Vercel cron as emergency fallback only.
export const CONTENT_OPS_EXECUTOR_POLICY = {
  primary: "cursor",
  fallback: "vercel-cron",
  activeRuntime: CONTENT_OPS_RUNTIME,
} as const;

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

export function isRuntimeEnabledForSource(source: ContentOpsAutomationSource): boolean {
  if (CONTENT_OPS_RUNTIME === "cursor") {
    return source === "cursor";
  }
  return source === "vercel-cron";
}

export function resolveRuntimeMismatchRule(source: ContentOpsAutomationSource): {
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
        ? "Cursor-first policy active. Route scheduler with source=cursor and keep CONTENT_OPS_AUTOMATION_RUNTIME=cursor plus CONTENT_OPS_AUTOMATION_TOKEN validation. Use vercel-cron only for emergency fallback after explicit runtime switch."
        : "Fallback override active. Set caller source=vercel-cron and verify CONTENT_OPS_AUTOMATION_RUNTIME=vercel-cron with x-vercel-cron header and CONTENT_OPS_AUTOMATION_TOKEN alignment. Revert runtime to cursor after incident.",
  };
}
