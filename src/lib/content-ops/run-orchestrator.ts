import { createAdminClient } from "@/lib/supabase/admin";
import {
  runDraftGeneratePipeline,
  runIngestPipeline,
  runPublishPipeline,
  runReviewGatePipeline,
} from "@/lib/content-ops/pipeline-runner";
import {
  CONTENT_OPS_RUN_SEQUENCE,
  type ContentOpsRunType,
} from "@/lib/content-ops/automation-config";
import { maybeEmitContentOpsAlert } from "@/lib/content-ops/alerting";
import type { Json } from "@/types/database.types";

type ExecuteContentOpsRunParams = {
  runType: ContentOpsRunType;
  triggerType: "manual" | "scheduled" | "api";
  initiatedBy?: string | null;
  metadata?: Record<string, unknown>;
};

function getWarningSummary(metadata: Json | null): string | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const obj = metadata as Record<string, unknown>;
  const maybeFailures = obj.failureMessages;
  if (Array.isArray(maybeFailures) && maybeFailures.length > 0) {
    const first = maybeFailures.find((v) => typeof v === "string");
    return typeof first === "string" ? `warning:${first}` : "warning:partial_failures";
  }
  const maybeFailedSources = obj.failedSources;
  if (typeof maybeFailedSources === "number" && maybeFailedSources > 0) {
    return `warning:${maybeFailedSources}_sources_failed`;
  }
  const maybeFailedCount = obj.failedCount;
  if (typeof maybeFailedCount === "number" && maybeFailedCount > 0) {
    return `warning:${maybeFailedCount}_items_failed`;
  }
  return null;
}

function shouldForceFailedStatus(runType: ContentOpsRunType, metadata: Json | null): boolean {
  if (runType !== "publish" && runType !== "publish_retry_failed") return false;
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return false;
  const failedCount = (metadata as Record<string, unknown>).failedCount;
  return typeof failedCount === "number" && failedCount > 0;
}

export async function executeContentOpsRun(
  params: ExecuteContentOpsRunParams,
): Promise<{ runId: string; status: "succeeded" | "failed"; metadata: Json | null }> {
  const nowIso = new Date().toISOString();
  const admin = createAdminClient();
  const { data: runRow, error } = await admin
    .from("content_runs")
    .insert({
      run_type: params.runType,
      status: "running",
      trigger_type: params.triggerType,
      initiated_by: params.initiatedBy ?? null,
      started_at: nowIso,
      metadata: (params.metadata ?? {}) as Json,
    })
    .select("id")
    .single();

  if (error || !runRow?.id) {
    throw new Error(`run_create_failed:${error?.message ?? "unknown"}`);
  }

  let status: "succeeded" | "failed" = "succeeded";
  let metadata: Json | null = null;
  let errorSummary: string | null = null;

  try {
    if (params.runType === "ingest") {
      metadata = await runIngestPipeline(runRow.id);
    } else if (params.runType === "draft_generate") {
      metadata = await runDraftGeneratePipeline(runRow.id);
    } else if (params.runType === "review_gate") {
      metadata = await runReviewGatePipeline(runRow.id);
    } else if (params.runType === "publish") {
      metadata = await runPublishPipeline();
    } else if (params.runType === "publish_retry_failed") {
      metadata = await runPublishPipeline({ retryFailedOnly: true });
    }
  } catch (e) {
    status = "failed";
    errorSummary = e instanceof Error ? e.message : "unknown";
  }

  if (!errorSummary) {
    errorSummary = getWarningSummary(metadata);
  }
  if (shouldForceFailedStatus(params.runType, metadata)) {
    status = "failed";
  }

  const alert = await maybeEmitContentOpsAlert({
    runId: runRow.id,
    runType: params.runType,
    status,
    metadata,
  });
  const finalMetadata =
    metadata && typeof metadata === "object" && !Array.isArray(metadata)
      ? ({ ...(metadata as Record<string, unknown>), alert } as Json)
      : ({ result: metadata, alert } as Json);

  await admin
    .from("content_runs")
    .update({
      status,
      ended_at: new Date().toISOString(),
      metadata: finalMetadata,
      error_summary: errorSummary,
    })
    .eq("id", runRow.id);

  return { runId: runRow.id, status, metadata: finalMetadata };
}

export async function runContentOpsScenario(params: {
  triggerType: "manual" | "scheduled" | "api";
  initiatedBy?: string | null;
  metadata?: Record<string, unknown>;
  sequence?: readonly ContentOpsRunType[];
}): Promise<void> {
  const sequence = params.sequence ?? (CONTENT_OPS_RUN_SEQUENCE as readonly ContentOpsRunType[]);
  for (const runType of sequence) {
    await executeContentOpsRun({
      runType,
      triggerType: params.triggerType,
      initiatedBy: params.initiatedBy ?? null,
      metadata: params.metadata,
    });
  }
}
