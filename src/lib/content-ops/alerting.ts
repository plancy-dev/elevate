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
  runType: string;
  status: "succeeded" | "failed";
  failedCount: number;
  reviewBacklogCount: number;
  reasons: string[];
  triggeredAt: string;
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

async function notifyWebhook(payload: AlertPayload): Promise<void> {
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

  if (!shouldAlert) return { emitted: false };

  const payload: AlertPayload = {
    runId: params.runId,
    runType: params.runType,
    status: params.status,
    failedCount,
    reviewBacklogCount,
    reasons,
    triggeredAt: new Date().toISOString(),
  };
  await notifyWebhook(payload);
  return { emitted: true, payload };
}
