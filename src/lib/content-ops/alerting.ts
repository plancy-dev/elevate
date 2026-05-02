import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database.types";

const FAILED_COUNT_ALERT_THRESHOLD = Number.parseInt(
  process.env.CONTENT_OPS_ALERT_FAILED_COUNT_THRESHOLD ?? "3",
  10,
);
const REVIEW_BACKLOG_ALERT_THRESHOLD = Number.parseInt(
  process.env.CONTENT_OPS_ALERT_REVIEW_BACKLOG_THRESHOLD ?? "20",
  10,
);

type AlertPayload = {
  runId: string;
  run_type: string;
  reason: string;
  next_action: string;
  operator_links: {
    runs: string;
    content_quality: string;
    morning_ops: string;
  };
  status: "succeeded" | "failed";
  failedCount: number;
  reviewBacklogCount: number;
  reasons: string[];
  triggeredAt: string;
};

export type StructuredContentOpsAlert = {
  run_type: string;
  reason: string;
  next_action: string;
  operator_links: AlertPayload["operator_links"];
  triggeredAt: string;
  metadata?: Record<string, unknown>;
};

function extractFailedCount(metadata: Json | null): number {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return 0;
  const failedCount = (metadata as Record<string, unknown>).failedCount;
  return typeof failedCount === "number" && Number.isFinite(failedCount) ? failedCount : 0;
}

function extractReasons(metadata: Json | null): string[] {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return [];
  const failures = (metadata as Record<string, unknown>).failureMessages;
  if (!Array.isArray(failures)) return [];
  return failures.filter((v): v is string => typeof v === "string").slice(0, 10);
}

async function getReviewBacklogCount(): Promise<number> {
  const admin = createAdminClient();
  const { count } = await admin
    .from("content_items")
    .select("id", { count: "exact", head: true })
    .eq("status", "review_required");
  return count ?? 0;
}

function toUtcDayKey(input: string): string | null {
  const date = new Date(input);
  const time = date.getTime();
  if (!Number.isFinite(time)) return null;
  return date.toISOString().slice(0, 10);
}

async function detectThreeDayRegression(): Promise<{
  triggered: boolean;
  reason: string | null;
  nextAction: string | null;
}> {
  const admin = createAdminClient();
  const sinceIso = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await admin
    .from("content_items")
    .select("status,created_at")
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: true });

  const todayKey = new Date().toISOString().slice(0, 10);
  const byDay = new Map<string, { reviewRequiredCount: number; sendFailedCount: number }>();
  for (const row of data ?? []) {
    const day = toUtcDayKey(row.created_at);
    if (!day || day >= todayKey) continue;
    const prev = byDay.get(day) ?? { reviewRequiredCount: 0, sendFailedCount: 0 };
    if (row.status === "review_required") prev.reviewRequiredCount += 1;
    if (row.status === "send_failed") prev.sendFailedCount += 1;
    byDay.set(day, prev);
  }
  const series = Array.from(byDay.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-3)
    .map((entry) => entry[1]);
  if (series.length < 3) return { triggered: false, reason: null, nextAction: null };
  const [d1, d2, d3] = series;
  const reviewRequiredTriggered =
    d1.reviewRequiredCount < d2.reviewRequiredCount &&
    d2.reviewRequiredCount < d3.reviewRequiredCount;
  const sendFailedTriggered =
    d1.sendFailedCount < d2.sendFailedCount &&
    d2.sendFailedCount < d3.sendFailedCount;
  if (reviewRequiredTriggered) {
    return {
      triggered: true,
      reason: "three_day_review_required_regression",
      nextAction:
        "Open /admin/morning-ops and execute backlog-first action plan before next publish window.",
    };
  }
  if (sendFailedTriggered) {
    return {
      triggered: true,
      reason: "three_day_send_failed_regression",
      nextAction:
        "Open /admin/morning-ops and run failure-class triage before retry window.",
    };
  }
  return { triggered: false, reason: null, nextAction: null };
}

async function notifyWebhook(payload: AlertPayload): Promise<void> {
  const webhookUrl = process.env.CONTENT_OPS_ALERT_WEBHOOK_URL?.trim();
  if (!webhookUrl) return;
  await fetch(webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
}

function defaultOperatorLinks() {
  return {
    runs: "/admin/runs",
    content_quality: "/admin/content-quality",
    morning_ops: "/admin/morning-ops",
  };
}

export async function emitStructuredContentOpsAlert(payload: StructuredContentOpsAlert): Promise<void> {
  const webhookUrl = process.env.CONTENT_OPS_ALERT_WEBHOOK_URL?.trim();
  if (!webhookUrl) return;
  await fetch(webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function maybeEmitContentOpsAlert(params: {
  runId: string;
  runType: string;
  status: "succeeded" | "failed";
  metadata: Json | null;
}): Promise<{ emitted: boolean; payload?: AlertPayload }> {
  const failedCount = extractFailedCount(params.metadata);
  const reviewBacklogCount = await getReviewBacklogCount();
  const reasons = extractReasons(params.metadata);
  const shouldAlert =
    params.status === "failed" ||
    failedCount >= FAILED_COUNT_ALERT_THRESHOLD ||
    reviewBacklogCount >= REVIEW_BACKLOG_ALERT_THRESHOLD;
  const threeDayRegression = await detectThreeDayRegression();
  const finalShouldAlert = shouldAlert || threeDayRegression.triggered;

  if (!finalShouldAlert) return { emitted: false };

  const payload: AlertPayload = {
    runId: params.runId,
    run_type: params.runType,
    reason:
      threeDayRegression.triggered && threeDayRegression.reason
        ? threeDayRegression.reason
        : params.status === "failed"
        ? "run_failed"
        : failedCount >= FAILED_COUNT_ALERT_THRESHOLD
          ? "failed_count_threshold_exceeded"
          : "review_backlog_threshold_exceeded",
    next_action:
      threeDayRegression.triggered && threeDayRegression.nextAction
        ? threeDayRegression.nextAction
        : params.status === "failed"
        ? "Open /admin/runs and /admin/content-quality, then execute class-specific recovery in morning-ops."
        : "Review failure classes and backlog owners before the next publish/retry window.",
    operator_links: defaultOperatorLinks(),
    status: params.status,
    failedCount,
    reviewBacklogCount,
    reasons,
    triggeredAt: new Date().toISOString(),
  };
  await notifyWebhook(payload);
  return { emitted: true, payload };
}
