import Link from "next/link";
import type { Metadata } from "next";
import { ListChecks } from "lucide-react";
import { getTranslations } from "next-intl/server";
import {
  listAdminContentQueue,
  runRetryFailedPublishOnly,
} from "@/actions/admin-content-ops";
import { ContentQueueReviewEditDialogDynamic } from "@/components/admin/content-queue-review-edit-dialog-dynamic";
import { ContentQueueRowActions } from "@/components/admin/content-queue-row-actions";
import { FieldSelect } from "@/components/ui/field-select";
import { Button } from "@/components/ui/button";
import {
  readLatestAiReview,
  readLatestAiRewrite,
  readLatestReviewGate,
} from "@/lib/admin/content-queue-metadata";
import { getContentOpsClaudeWhenGatePassedEnabled } from "@/lib/content-ops/claude-ui-policy";
import type { Json } from "@/types/database.types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Dashboard.adminContentQueue");
  return {
    title: t("metaTitle"),
  };
}

type SearchParams = Promise<{
  type?: string;
  status?: string;
}>;

const TYPE_OPTIONS = ["all", "blog", "newsletter"] as const;
const STATUS_OPTIONS = [
  "all",
  "draft",
  "review_required",
  "approved",
  "rejected",
  "scheduled",
  "publishing",
  "published",
  "send_failed",
] as const;

export default async function AdminContentQueuePage(props: {
  searchParams: SearchParams;
}) {
  const t = await getTranslations("Dashboard.adminContentQueue");
  const searchParams = await props.searchParams;
  const typeFilter =
    TYPE_OPTIONS.find((v) => v === searchParams.type) ?? "all";
  const statusFilter =
    STATUS_OPTIONS.find((v) => v === searchParams.status) ?? "all";

  const listRes = await listAdminContentQueue({
    type: typeFilter,
    status: statusFilter,
  });
  const rows = listRes.ok ? listRes.rows : [];
  const nowMs = new Date().getTime();
  const queueSummary = summarizeQueue(rows, nowMs);
  const claudeWhenGatePassedEnabled = getContentOpsClaudeWhenGatePassedEnabled();

  return (
    <div className="min-h-screen bg-paper-50">
      <div className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-ink-100 bg-paper-50 px-6">
        <div className="flex min-w-0 items-center gap-2">
          <ListChecks className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          <h1 className="truncate text-sm font-medium text-ink-900">{t("title")}</h1>
        </div>
        <Link
          href="/admin"
          className="text-xs text-vermilion-600 transition-colors hover:text-vermilion-700"
        >
          {t("backToAdmin")}
        </Link>
      </div>

      <div className="max-w-6xl space-y-4 p-6">
        <p className="text-sm leading-relaxed text-ink-700">
          {t("intro")}
        </p>
        <div className="grid gap-2 md:grid-cols-3">
          <QueueSummaryCard label={t("cards.pendingApproval")} value={queueSummary.pendingApproval} />
          <QueueSummaryCard label={t("cards.staleOver24h")} value={queueSummary.staleOver24h} tone="warning" />
          <QueueSummaryCard label={t("cards.mustReviewNow")} value={queueSummary.mustReviewNow} tone="danger" />
        </div>

        <form className="flex flex-wrap items-end gap-3 border border-ink-100 bg-paper-0 p-3">
          <div className="space-y-1">
            <label htmlFor="type" className="text-xs text-ink-500">
              {t("filters.type")}
            </label>
            <FieldSelect
              id="type"
              name="type"
              defaultValue={typeFilter}
              variant="boxed"
              controlSize="sm"
              className="min-w-[140px] text-xs"
              options={TYPE_OPTIONS.map((opt) => ({
                value: opt,
                label: toTypeLabel(t, opt),
              }))}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="status" className="text-xs text-ink-500">
              {t("filters.status")}
            </label>
            <FieldSelect
              id="status"
              name="status"
              defaultValue={statusFilter}
              variant="boxed"
              controlSize="sm"
              className="min-w-[170px] text-xs"
              options={STATUS_OPTIONS.map((opt) => ({
                value: opt,
                label: toStatusFilterLabel(t, opt),
              }))}
            />
          </div>
          <button
            type="submit"
            className="border border-ink-100 bg-paper-50 px-3 py-1.5 text-xs text-ink-900 hover:bg-highlight"
          >
            {t("filters.apply")}
          </button>
          <button
            type="submit"
            formAction={runRetryFailedPublishOnly}
            className="border border-ink-100 bg-vermilion-100/40 px-3 py-1.5 text-xs text-ink-900 hover:bg-vermilion-100"
          >
            {t("filters.retryFailedOnly")}
          </button>
        </form>

        {!listRes.ok ? <p className="text-xs text-danger">{listRes.error}</p> : null}

        {rows.length === 0 ? (
          <p className="text-xs text-ink-500">{t("empty")}</p>
        ) : (
          <div className="border border-ink-100">
            <table className="w-full table-fixed text-center text-xs">
              <thead>
                <tr className="border-b border-ink-100 bg-paper-50">
                  <th className="p-2 align-middle font-medium text-ink-700">{t("columns.title")}</th>
                  <th className="hidden p-2 align-middle font-medium text-ink-700 whitespace-nowrap sm:table-cell">{t("columns.type")}</th>
                  <th className="p-2 align-middle font-medium text-ink-700 whitespace-nowrap">{t("columns.status")}</th>
                  <th className="hidden p-2 align-middle font-medium text-ink-700 whitespace-nowrap md:table-cell">{t("columns.quality")}</th>
                  <th className="hidden p-2 align-middle font-medium text-ink-700 lg:table-cell">{t("columns.aiAudit")}</th>
                  <th className="hidden p-2 align-middle font-medium text-ink-700 whitespace-nowrap lg:table-cell">{t("columns.opsSignal")}</th>
                  <th className="p-2 align-middle font-medium text-ink-700 whitespace-nowrap">{t("columns.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-ink-100/80">
                    <td className="p-2 align-middle min-w-0 text-ink-900">
                      <div className="mx-auto max-w-full text-center">
                        <div className="overflow-hidden text-ellipsis whitespace-nowrap font-medium" title={row.title}>
                          {row.title}
                        </div>
                        <p className="mt-0.5 text-center text-[10px] leading-tight text-ink-400 md:hidden">
                          <span className="font-medium text-ink-500">{t("columns.quality")}:</span>{" "}
                          {row.source_quality_score ?? "-"} / {row.fact_check_score ?? "-"}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center justify-center gap-2 text-[11px]">
                          <span className="text-ink-500">
                            <span className="sm:hidden">{toTypeLabel(t, row.type)} · </span>
                            {row.locale}
                          </span>
                          <ContentQueueReviewEditDialogDynamic
                            itemId={row.id}
                            claudeWhenGatePassedEnabled={claudeWhenGatePassedEnabled}
                            trigger={
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-auto min-h-0 px-1.5 py-0.5 text-[11px] font-medium text-vermilion-600 hover:bg-vermilion-100/30 hover:text-vermilion-700"
                              >
                                {t("actions.openReview")}
                              </Button>
                            }
                          />
                        </div>
                      </div>
                    </td>
                    <td className="hidden p-2 align-middle text-ink-700 whitespace-nowrap sm:table-cell">{toTypeLabel(t, row.type)}</td>
                    <td className="p-2 align-middle text-ink-700 whitespace-nowrap">{toItemStatusLabel(t, row.status)}</td>
                    <td className="hidden p-2 align-middle text-ink-700 whitespace-nowrap md:table-cell">
                      {row.source_quality_score ?? "-"} / {row.fact_check_score ?? "-"}
                    </td>
                    <td className="hidden p-2 align-middle min-w-0 text-ink-700 lg:table-cell">
                      <AiAuditCell t={t} metadata={row.metadata} />
                    </td>
                    <td className="hidden p-2 align-middle text-ink-700 whitespace-nowrap lg:table-cell">
                      <OpsSignalCell
                        t={t}
                        status={row.status}
                        createdAt={row.created_at}
                        nowMs={nowMs}
                        metadata={row.metadata}
                        reviewNotes={row.review_notes}
                      />
                    </td>
                    <td className="p-2 align-middle">
                      <ContentQueueRowActions
                        row={row}
                        typeLabel={toTypeLabel(t, row.type)}
                        statusLabel={toItemStatusLabel(t, row.status)}
                        claudeWhenGatePassedEnabled={claudeWhenGatePassedEnabled}
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

function QueueSummaryCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "warning" | "danger";
}) {
  const toneClass =
    tone === "warning"
      ? "text-amber-700"
      : tone === "danger"
        ? "text-danger"
        : "text-ink-900";
  return (
    <div className="border border-ink-100 bg-paper-0 p-3">
      <p className="text-[11px] uppercase tracking-wide text-ink-500">{label}</p>
      <p className={`mt-1 text-sm font-medium ${toneClass}`}>{value}</p>
    </div>
  );
}

function AiAuditCell({
  t,
  metadata,
}: {
  t: (key: string, values?: Record<string, string | number | Date>) => string;
  metadata: Json | null;
}) {
  const review = readLatestAiReview(metadata);
  const rewrite = readLatestAiRewrite(metadata);
  if (!review && !rewrite) {
    return <span className="text-ink-500">-</span>;
  }

  return (
    <div className="flex min-w-0 max-w-full flex-col items-center gap-1 text-center">
      {review ? (
        <div className="flex flex-wrap items-center justify-center gap-1">
          <span
            className={`inline-flex border px-2 py-0.5 text-[11px] font-medium ${
              review.decision === "auto_approve_candidate"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : review.decision === "needs_rewrite"
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-ink-200 bg-paper-50 text-ink-700"
            }`}
          >
            {toAiDecisionLabel(t, review.decision)}
          </span>
          <span className="text-[11px] text-ink-500">
            {t("aiAudit.confidence", { value: Math.round(review.confidence * 100) })}
          </span>
        </div>
      ) : null}
      {review?.policyReason ? (
        <p className="line-clamp-2 max-w-56 text-[11px] text-ink-500" title={review.policyReason}>
          {t("aiAudit.policyReason")}: {toAiPolicyReasonLabel(t, review.policyReason)}
        </p>
      ) : null}
      {rewrite ? (
        <p className="text-[11px] text-ink-500">
          {t("aiAudit.rewriteDecision")}: {toRewriteDecisionLabel(t, rewrite.decisionAfter)}
        </p>
      ) : null}
    </div>
  );
}

function summarizeQueue(
  rows: Array<{ status: string; created_at: string; metadata: Json | null; review_notes: string | null }>,
  nowMs: number,
) {
  let pendingApproval = 0;
  let staleOver24h = 0;
  let mustReviewNow = 0;
  for (const row of rows) {
    const isPending = row.status === "draft" || row.status === "review_required";
    if (isPending) pendingApproval += 1;
    if (isPending && nowMs - new Date(row.created_at).getTime() >= 24 * 60 * 60 * 1000) {
      staleOver24h += 1;
    }
    if (isMustReviewNow(row, nowMs)) {
      mustReviewNow += 1;
    }
  }
  return { pendingApproval, staleOver24h, mustReviewNow };
}

function isMustReviewNow(row: {
  status: string;
  created_at: string;
  metadata: Json | null;
  review_notes: string | null;
}, nowMs: number): boolean {
  if (row.status !== "review_required") return false;
  const latest = readLatestReviewGate(row.metadata);
  const oldEnough = nowMs - new Date(row.created_at).getTime() >= 24 * 60 * 60 * 1000;
  if (oldEnough) return true;
  if (!latest) return true;
  if (latest.qualityScore < 12) return true;
  if (latest.reasons.some((reason) => reason.startsWith("low_"))) return true;
  return Boolean(row.review_notes?.includes("review_gate:"));
}

function OpsSignalCell({
  t,
  status,
  createdAt,
  nowMs,
  metadata,
  reviewNotes,
}: {
  t: (key: string, values?: Record<string, string | number | Date>) => string;
  status: string;
  createdAt: string;
  nowMs: number;
  metadata: Json | null;
  reviewNotes: string | null;
}) {
  if (status !== "review_required") {
    return (
      <div className="flex justify-center">
        <span className="text-ink-500">-</span>
      </div>
    );
  }

  const latest = readLatestReviewGate(metadata);
  const ageHours = Math.floor((nowMs - new Date(createdAt).getTime()) / (60 * 60 * 1000));
  const isSlaRisk = ageHours >= 24;
  const hasLowQuality = latest ? latest.qualityScore < 12 : true;
  const label = isSlaRisk
    ? t("opsSignal.slaRisk", { hours: ageHours })
    : hasLowQuality
      ? t("opsSignal.qualityRework")
      : t("opsSignal.reviewNeeded");
  const details = latest?.reasons.join(",") || reviewNotes || t("opsSignal.manualReviewRequired");
  return (
    <div className="flex justify-center">
      <span
        className={`inline-flex max-w-44 justify-center border border-ink-100 bg-paper-50 px-2 py-0.5 text-center text-[11px] font-medium leading-snug ${isSlaRisk ? "text-danger" : "text-amber-700"}`}
        title={details}
      >
        {label}
      </span>
    </div>
  );
}

function toTypeLabel(t: (key: string) => string, type: string) {
  if (type === "all") return t("type.all");
  if (type === "blog") return t("type.blog");
  if (type === "newsletter") return t("type.newsletter");
  return type;
}

function toStatusFilterLabel(t: (key: string) => string, status: string) {
  if (status === "all") return t("status.all");
  return toItemStatusLabel(t, status);
}

function toItemStatusLabel(t: (key: string) => string, status: string) {
  if (status === "draft") return t("status.draft");
  if (status === "review_required") return t("status.reviewRequired");
  if (status === "approved") return t("status.approved");
  if (status === "rejected") return t("status.rejected");
  if (status === "scheduled") return t("status.scheduled");
  if (status === "publishing") return t("status.publishing");
  if (status === "published") return t("status.published");
  if (status === "send_failed") return t("status.sendFailed");
  return status;
}

function toAiDecisionLabel(
  t: (key: string) => string,
  decision: "auto_approve_candidate" | "needs_rewrite" | "hold_manual",
) {
  if (decision === "auto_approve_candidate") return t("aiAudit.decision.autoApproveCandidate");
  if (decision === "needs_rewrite") return t("aiAudit.decision.needsRewrite");
  return t("aiAudit.decision.holdManual");
}

function toRewriteDecisionLabel(
  t: (key: string) => string,
  decision: "ready_for_approval" | "needs_manual_review",
) {
  if (decision === "ready_for_approval") return t("aiAudit.rewrite.readyForApproval");
  return t("aiAudit.rewrite.needsManualReview");
}

function toAiPolicyReasonLabel(t: (key: string) => string, reason: string) {
  if (reason === "auto_approval_policy_passed") return t("aiAudit.policy.autoApprovalPolicyPassed");
  if (reason === "decision_not_auto_approve_candidate") {
    return t("aiAudit.policy.decisionNotAutoApproveCandidate");
  }
  if (reason === "confidence_below_threshold") return t("aiAudit.policy.confidenceBelowThreshold");
  if (reason === "review_gate_not_passed") return t("aiAudit.policy.reviewGateNotPassed");
  if (reason === "quality_score_below_threshold") return t("aiAudit.policy.qualityScoreBelowThreshold");
  if (reason === "hard_block_reason_detected") return t("aiAudit.policy.hardBlockReasonDetected");
  return reason;
}
