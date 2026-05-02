import Link from "next/link";
import type { Metadata } from "next";
import { Activity } from "lucide-react";
import { getTranslations } from "next-intl/server";
import {
  listAdminContentQueue,
  listAdminContentRuns,
} from "@/actions/admin-content-ops";
import { AdminRunMetadataCell } from "@/components/admin/admin-run-metadata-cell";
import { AdminRunsActionsForm } from "@/components/admin/admin-runs-actions-form";
import type { Json } from "@/types/database.types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Dashboard.adminRuns");
  return {
    title: t("metaTitle"),
  };
}

export default async function AdminRunsPage() {
  const t = await getTranslations("Dashboard.adminRuns");
  const listRes = await listAdminContentRuns();
  const queueRes = await listAdminContentQueue({ status: "review_required" });
  const rows = listRes.ok ? listRes.rows : [];
  const reviewQueueRows = queueRes.ok ? queueRes.rows : [];
  const summary = buildRunSummary(rows);
  const ops = buildOpsSummary(reviewQueueRows);

  return (
    <div className="min-h-screen bg-paper-50">
      <div className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-ink-100 bg-paper-50 px-6">
        <div className="flex min-w-0 items-center gap-2">
          <Activity className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          <h1 className="truncate text-sm font-medium text-ink-900">{t("title")}</h1>
        </div>
        <Link
          href="/admin"
          className="text-xs text-vermilion-600 transition-colors hover:text-vermilion-700"
        >
          {t("backToAdmin")}
        </Link>
      </div>

      <div className="max-w-5xl space-y-5 p-6">
        <p className="text-sm leading-relaxed text-ink-700">
          {t("intro")}
        </p>
        <div className="grid gap-2 md:grid-cols-4">
          <SummaryCard label={t("cards.created")} value={summary.createdCount} tone="neutral" />
          <SummaryCard label={t("cards.sent")} value={summary.sentCount} tone="success" />
          <SummaryCard label={t("cards.failed")} value={summary.failedCount} tone="danger" />
          <SummaryCard label={t("cards.deferred")} value={summary.deferredCount} tone="warning" />
        </div>
        <div className="grid gap-2 md:grid-cols-1">
          <SummaryCard
            label={t("cards.topFailureReason")}
            value={summary.topFailureReason ?? "-"}
            tone="warning"
          />
        </div>
        <div className="grid gap-2 md:grid-cols-3">
          <SummaryCard label={t("cards.reviewQueue")} value={ops.reviewQueueCount} tone="neutral" />
          <SummaryCard label={t("cards.mustReviewNow")} value={ops.mustReviewCount} tone="danger" />
          <SummaryCard label={t("cards.oldestReviewAgeHours")} value={ops.oldestReviewAgeHours} tone="warning" />
        </div>
        <div className="border border-ink-100 bg-paper-0 p-3 text-xs leading-relaxed text-ink-700">
          <p className="font-medium text-ink-900">{t("scenario.title")}</p>
          <p className="mt-1">
            {t("scenario.description")}
          </p>
        </div>

        <AdminRunsActionsForm
          labels={{
            runTypeLabel: t("form.runTypeLabel"),
            queueManualRun: t("form.queueManualRun"),
            runScenario: t("form.runScenario"),
            retryFailedOnly: t("form.retryFailedOnly"),
            pendingManualRun: t("form.pendingManualRun"),
            pendingScenario: t("form.pendingScenario"),
            pendingRetryFailedOnly: t("form.pendingRetryFailedOnly"),
          }}
          runTypeOptions={[
            { value: "ingest", label: t("runType.ingest") },
            { value: "draft_generate", label: t("runType.draftGenerate") },
            { value: "review_gate", label: t("runType.reviewGate") },
            { value: "publish", label: t("runType.publish") },
            { value: "publish_retry_failed", label: t("runType.publishRetryFailed") },
          ]}
        />

        {!listRes.ok ? <p className="text-xs text-danger">{listRes.error}</p> : null}

        {rows.length === 0 ? (
          <p className="text-xs text-ink-500">{t("empty")}</p>
        ) : (
          <div className="overflow-x-auto border border-ink-100">
            <table className="w-full min-w-[980px] text-left text-xs">
              <thead>
                <tr className="border-b border-ink-100 bg-paper-50">
                  <th className="p-2 font-medium text-ink-700 whitespace-nowrap">{t("columns.type")}</th>
                  <th className="p-2 font-medium text-ink-700 whitespace-nowrap">{t("columns.result")}</th>
                  <th className="p-2 font-medium text-ink-700 whitespace-nowrap">{t("columns.status")}</th>
                  <th className="p-2 font-medium text-ink-700 whitespace-nowrap">{t("columns.trigger")}</th>
                  <th className="p-2 font-medium text-ink-700 whitespace-nowrap">{t("columns.started")}</th>
                  <th className="p-2 font-medium text-ink-700 whitespace-nowrap">{t("columns.ended")}</th>
                  <th className="p-2 font-medium text-ink-700 whitespace-nowrap">{t("columns.error")}</th>
                  <th className="p-2 font-medium text-ink-700 whitespace-nowrap">{t("columns.metadata")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-ink-100/80">
                    <td className="p-2 text-ink-900 whitespace-nowrap">{toRunTypeLabel(t, row.run_type)}</td>
                    <td className="p-2 whitespace-nowrap">
                      {renderRunResultBadge(t, row.status, row.error_summary, row.metadata)}
                    </td>
                    <td className="p-2 text-ink-700 whitespace-nowrap">{toRunStatusLabel(t, row.status)}</td>
                    <td className="p-2 text-ink-700 whitespace-nowrap">{toTriggerLabel(t, row.trigger_type)}</td>
                    <td className="p-2 whitespace-nowrap text-ink-500">
                      {row.started_at
                        ? `${new Date(row.started_at).toISOString().replace("T", " ").slice(0, 19)} UTC`
                        : "-"}
                    </td>
                    <td className="p-2 whitespace-nowrap text-ink-500">
                      {row.ended_at
                        ? `${new Date(row.ended_at).toISOString().replace("T", " ").slice(0, 19)} UTC`
                        : "-"}
                    </td>
                    <td className="p-2 text-danger">
                      <CompactSingleLine value={row.error_summary} maxWidthClass="max-w-[320px]" />
                    </td>
                    <td className="p-2 text-ink-500">
                      <AdminRunMetadataCell
                        metadata={row.metadata}
                        labels={{
                          empty: "-",
                          open: t("metadata.open"),
                          modalTitle: t("metadata.modalTitle"),
                          modalDescription: t("metadata.modalDescription"),
                          close: t("metadata.close"),
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone: "neutral" | "success" | "danger" | "warning";
}) {
  const toneClass =
    tone === "success"
      ? "text-emerald-700"
      : tone === "danger"
        ? "text-danger"
        : tone === "warning"
          ? "text-amber-700"
          : "text-ink-900";
  return (
    <div className="border border-ink-100 bg-paper-0 p-3">
      <p className="text-[11px] uppercase tracking-wide text-ink-500">{label}</p>
      <p className={`mt-1 text-sm font-medium ${toneClass}`}>{String(value)}</p>
    </div>
  );
}

function renderRunResultBadge(
  t: (key: string) => string,
  status: string,
  errorSummary: string | null,
  metadata: Json | null,
) {
  const result = getRunResult(status, errorSummary, metadata);
  const failureHint = getFailureHint(errorSummary, metadata);
  if (result === "failure") {
    return (
      <span
        className="inline-flex whitespace-nowrap border border-ink-100 bg-paper-50 px-2 py-0.5 text-[11px] font-medium text-danger"
        title={failureHint ?? undefined}
      >
        {t("result.failure")}
      </span>
    );
  }
  if (result === "partial") {
    return (
      <span
        className="inline-flex whitespace-nowrap border border-ink-100 bg-paper-50 px-2 py-0.5 text-[11px] font-medium text-amber-700"
        title={failureHint ?? t("result.partialHint")}
      >
        {t("result.partial")}
      </span>
    );
  }
  return (
    <span className="inline-flex whitespace-nowrap border border-ink-100 bg-paper-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
      {t("result.success")}
    </span>
  );
}

function getRunResult(
  status: string,
  errorSummary: string | null,
  metadata: Json | null,
): "success" | "partial" | "failure" {
  if (status === "failed") return "failure";
  if (status !== "succeeded") return "partial";

  if (errorSummary?.startsWith("warning:")) return "partial";
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return "success";
  }

  const obj = metadata as Record<string, unknown>;
  if (numericValue(obj.failedCount) > 0) return "partial";
  if (numericValue(obj.deferredCount) > 0) return "partial";
  if (numericValue(obj.failedSources) > 0) return "partial";
  if (arrayLength(obj.failureMessages) > 0) return "partial";

  const nestedResult = obj.result;
  if (
    nestedResult &&
    typeof nestedResult === "object" &&
    !Array.isArray(nestedResult)
  ) {
    const nested = nestedResult as Record<string, unknown>;
    if (numericValue(nested.failedCount) > 0) return "partial";
    if (numericValue(nested.deferredCount) > 0) return "partial";
    if (numericValue(nested.failedSources) > 0) return "partial";
    if (arrayLength(nested.failureMessages) > 0) return "partial";
  }

  return "success";
}

function numericValue(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function arrayLength(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

function getFailureHint(
  errorSummary: string | null,
  metadata: Json | null,
): string | null {
  const firstFromError = errorSummary?.trim() ? errorSummary.trim() : null;
  const count = getFailureCount(errorSummary, metadata);
  if (firstFromError) {
    return count > 1 ? `${firstFromError} (+${count - 1})` : firstFromError;
  }
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }
  const obj = metadata as Record<string, unknown>;
  const direct = firstStringInFailureMessages(obj.failureMessages);
  if (direct) return count > 1 ? `${direct} (+${count - 1})` : direct;
  const nestedResult = obj.result;
  if (
    nestedResult &&
    typeof nestedResult === "object" &&
    !Array.isArray(nestedResult)
  ) {
    const nested = nestedResult as Record<string, unknown>;
    const nestedMsg = firstStringInFailureMessages(nested.failureMessages);
    if (nestedMsg) return count > 1 ? `${nestedMsg} (+${count - 1})` : nestedMsg;
  }
  return null;
}

function firstStringInFailureMessages(value: unknown): string | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const first = value.find((item) => typeof item === "string");
  return typeof first === "string" ? first : null;
}

function getFailureCount(errorSummary: string | null, metadata: Json | null): number {
  if (errorSummary?.startsWith("warning:")) {
    return 1;
  }
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return errorSummary?.trim() ? 1 : 0;
  }

  const obj = metadata as Record<string, unknown>;
  const failedCount = numericValue(obj.failedCount);
  if (failedCount > 0) return failedCount;
  const deferredCount = numericValue(obj.deferredCount);
  if (deferredCount > 0) return deferredCount;

  const directMsgs = Array.isArray(obj.failureMessages) ? obj.failureMessages.length : 0;
  if (directMsgs > 0) return directMsgs;

  const nestedResult = obj.result;
  if (
    nestedResult &&
    typeof nestedResult === "object" &&
    !Array.isArray(nestedResult)
  ) {
    const nested = nestedResult as Record<string, unknown>;
    const nestedFailedCount = numericValue(nested.failedCount);
    if (nestedFailedCount > 0) return nestedFailedCount;
    const nestedDeferredCount = numericValue(nested.deferredCount);
    if (nestedDeferredCount > 0) return nestedDeferredCount;
    const nestedMsgs = Array.isArray(nested.failureMessages)
      ? nested.failureMessages.length
      : 0;
    if (nestedMsgs > 0) return nestedMsgs;
  }
  return errorSummary?.trim() ? 1 : 0;
}

function buildRunSummary(rows: Array<{ error_summary: string | null; metadata: Json | null }>) {
  let createdCount = 0;
  let sentCount = 0;
  let failedCount = 0;
  let deferredCount = 0;
  const reasonCounts = new Map<string, number>();

  for (const row of rows.slice(0, 100)) {
    const payload = normalizeRunMetadata(row.metadata);
    createdCount += numericValue(payload.createdItems);
    sentCount += numericValue(payload.sentCount);
    failedCount += numericValue(payload.failedCount);
    deferredCount += numericValue(payload.deferredCount);
    for (const reason of parseFailureReasons(row.error_summary, payload.failureMessages)) {
      reasonCounts.set(reason, (reasonCounts.get(reason) ?? 0) + 1);
    }
  }

  let topFailureReason: string | null = null;
  let topCount = 0;
  for (const [reason, count] of reasonCounts.entries()) {
    if (count > topCount) {
      topCount = count;
      topFailureReason = `${reason} (${count})`;
    }
  }

  return { createdCount, sentCount, failedCount, deferredCount, topFailureReason };
}

function normalizeRunMetadata(metadata: Json | null): Record<string, unknown> {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {};
  }
  const obj = metadata as Record<string, unknown>;
  const nested = obj.result;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    return nested as Record<string, unknown>;
  }
  return obj;
}

function parseFailureReasons(
  errorSummary: string | null,
  failureMessagesRaw: unknown,
): string[] {
  const parsed: string[] = [];
  if (errorSummary?.trim()) {
    parsed.push(errorSummary.replace(/^warning:/, "").trim());
  }
  if (Array.isArray(failureMessagesRaw)) {
    for (const message of failureMessagesRaw) {
      if (typeof message !== "string") continue;
      const cleaned = message
        .replace(/^\[[^\]]+\]\s*/, "")
        .replace(/^warning:/, "")
        .trim();
      if (cleaned) parsed.push(cleaned);
    }
  }
  return parsed;
}

function buildOpsSummary(rows: Array<{ created_at: string; metadata: Json | null }>) {
  let mustReviewCount = 0;
  let oldestReviewAgeHours = 0;
  for (const row of rows) {
    const ageHours = Math.floor((Date.now() - new Date(row.created_at).getTime()) / (60 * 60 * 1000));
    if (ageHours > oldestReviewAgeHours) oldestReviewAgeHours = ageHours;
    const qualityScore = readQualityScore(row.metadata);
    if (ageHours >= 24 || qualityScore < 12) {
      mustReviewCount += 1;
    }
  }
  return {
    reviewQueueCount: rows.length,
    mustReviewCount,
    oldestReviewAgeHours,
  };
}

function readQualityScore(metadata: Json | null): number {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return 0;
  const gate = (metadata as Record<string, unknown>).review_gate;
  if (!gate || typeof gate !== "object" || Array.isArray(gate)) return 0;
  const latest = (gate as Record<string, unknown>).latest;
  if (!latest || typeof latest !== "object" || Array.isArray(latest)) return 0;
  const metrics = (latest as Record<string, unknown>).metrics;
  if (!metrics || typeof metrics !== "object" || Array.isArray(metrics)) return 0;
  const raw = Number((metrics as Record<string, unknown>).qualityScore ?? 0);
  return Number.isFinite(raw) ? raw : 0;
}

function toRunTypeLabel(t: (key: string) => string, runType: string) {
  if (runType === "ingest") return t("runType.ingest");
  if (runType === "draft_generate") return t("runType.draftGenerate");
  if (runType === "review_gate") return t("runType.reviewGate");
  if (runType === "publish") return t("runType.publish");
  if (runType === "publish_retry_failed") return t("runType.publishRetryFailed");
  return runType;
}

function toRunStatusLabel(t: (key: string) => string, status: string) {
  if (status === "queued") return t("status.queued");
  if (status === "running") return t("status.running");
  if (status === "succeeded") return t("status.succeeded");
  if (status === "failed") return t("status.failed");
  return status;
}

function toTriggerLabel(t: (key: string) => string, triggerType: string) {
  if (triggerType === "manual") return t("trigger.manual");
  if (triggerType === "automation") return t("trigger.automation");
  return triggerType;
}

function CompactSingleLine({
  value,
  maxWidthClass,
}: {
  value: string | null;
  maxWidthClass: string;
}) {
  if (!value?.trim()) return <span>-</span>;
  return (
    <span className={`block truncate ${maxWidthClass}`} title={value}>
      {value}
    </span>
  );
}
