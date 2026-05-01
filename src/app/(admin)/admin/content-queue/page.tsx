import Link from "next/link";
import type { Metadata } from "next";
import { ListChecks } from "lucide-react";
import {
  listAdminContentQueue,
  runRetryFailedPublishOnly,
  updateContentItemStatus,
} from "@/actions/admin-content-ops";
import type { Json } from "@/types/database.types";

export const metadata: Metadata = {
  title: "Admin | Content Queue",
};

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

  return (
    <div className="min-h-screen bg-paper-50">
      <div className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-ink-100 bg-paper-50 px-6">
        <div className="flex min-w-0 items-center gap-2">
          <ListChecks className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          <h1 className="truncate text-sm font-medium text-ink-900">Content Queue</h1>
        </div>
        <Link
          href="/admin"
          className="text-xs text-vermilion-600 transition-colors hover:text-vermilion-700"
        >
          Back to admin
        </Link>
      </div>

      <div className="max-w-6xl space-y-4 p-6">
        <p className="text-sm leading-relaxed text-ink-700">
          Review generated blog/newsletter drafts and move approved items to schedule
          or immediate publish.
        </p>
        <div className="grid gap-2 md:grid-cols-3">
          <QueueSummaryCard label="Pending approval" value={queueSummary.pendingApproval} />
          <QueueSummaryCard label="Stale >24h" value={queueSummary.staleOver24h} tone="warning" />
          <QueueSummaryCard label="Must-review now" value={queueSummary.mustReviewNow} tone="danger" />
        </div>

        <form className="flex flex-wrap items-end gap-3 border border-ink-100 bg-paper-0 p-3">
          <div className="space-y-1">
            <label htmlFor="type" className="text-xs text-ink-500">
              Type
            </label>
            <select
              id="type"
              name="type"
              defaultValue={typeFilter}
              className="min-w-[140px] border border-ink-100 bg-paper-50 px-2 py-1.5 text-xs text-ink-900"
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="status" className="text-xs text-ink-500">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={statusFilter}
              className="min-w-[170px] border border-ink-100 bg-paper-50 px-2 py-1.5 text-xs text-ink-900"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="border border-ink-100 bg-paper-50 px-3 py-1.5 text-xs text-ink-900 hover:bg-highlight"
          >
            Apply filters
          </button>
          <button
            type="submit"
            formAction={runRetryFailedPublishOnly}
            className="border border-ink-100 bg-vermilion-100/40 px-3 py-1.5 text-xs text-ink-900 hover:bg-vermilion-100"
          >
            Retry failed only
          </button>
        </form>

        {!listRes.ok ? <p className="text-xs text-danger">{listRes.error}</p> : null}

        {rows.length === 0 ? (
          <p className="text-xs text-ink-500">No queue items found.</p>
        ) : (
          <div className="overflow-x-auto border border-ink-100">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-ink-100 bg-paper-50">
                  <th className="p-2 font-medium text-ink-700">Title</th>
                  <th className="p-2 font-medium text-ink-700">Type</th>
                  <th className="p-2 font-medium text-ink-700">Status</th>
                  <th className="p-2 font-medium text-ink-700">Quality</th>
                  <th className="p-2 font-medium text-ink-700">Gate</th>
                  <th className="p-2 font-medium text-ink-700">Ops signal</th>
                  <th className="p-2 font-medium text-ink-700">Updated</th>
                  <th className="p-2 font-medium text-ink-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-ink-100/80">
                    <td className="p-2 text-ink-900">
                      <div className="font-medium">{row.title}</div>
                      <div className="mt-0.5 text-[11px] text-ink-500">{row.locale}</div>
                    </td>
                    <td className="p-2 text-ink-700">{row.type}</td>
                    <td className="p-2 text-ink-700">{row.status}</td>
                    <td className="p-2 text-ink-700">
                      {row.source_quality_score ?? "-"} / {row.fact_check_score ?? "-"}
                    </td>
                    <td className="p-2 text-ink-700">
                      <ReviewGateCell metadata={row.metadata} />
                    </td>
                    <td className="p-2 text-ink-700">
                      <OpsSignalCell
                        status={row.status}
                        createdAt={row.created_at}
                        nowMs={nowMs}
                        metadata={row.metadata}
                        reviewNotes={row.review_notes}
                      />
                    </td>
                    <td className="p-2 whitespace-nowrap text-ink-500">
                      {new Date(row.updated_at).toISOString().replace("T", " ").slice(0, 19)} UTC
                    </td>
                    <td className="p-2">
                      <div className="flex flex-wrap gap-1.5">
                        <form action={updateContentItemStatus}>
                          <input type="hidden" name="id" value={row.id} />
                          <input type="hidden" name="status" value="approved" />
                          <button
                            type="submit"
                            className="border border-ink-100 px-2 py-1 text-[11px] text-ink-700 hover:bg-highlight"
                          >
                            Approve
                          </button>
                        </form>
                        <form action={updateContentItemStatus}>
                          <input type="hidden" name="id" value={row.id} />
                          <input type="hidden" name="status" value="review_required" />
                          <button
                            type="submit"
                            className="border border-ink-100 px-2 py-1 text-[11px] text-ink-700 hover:bg-highlight"
                          >
                            Request changes
                          </button>
                        </form>
                        <form action={updateContentItemStatus}>
                          <input type="hidden" name="id" value={row.id} />
                          <input type="hidden" name="status" value="scheduled" />
                          <button
                            type="submit"
                            className="border border-ink-100 px-2 py-1 text-[11px] text-ink-700 hover:bg-highlight"
                          >
                            Schedule
                          </button>
                        </form>
                        <form action={updateContentItemStatus}>
                          <input type="hidden" name="id" value={row.id} />
                          <input type="hidden" name="status" value="publishing" />
                          <button
                            type="submit"
                            className="border border-ink-100 px-2 py-1 text-[11px] text-ink-700 hover:bg-highlight"
                          >
                            Publish now
                          </button>
                        </form>
                        <form action={updateContentItemStatus}>
                          <input type="hidden" name="id" value={row.id} />
                          <input type="hidden" name="status" value="send_failed" />
                          <button
                            type="submit"
                            className="border border-ink-100 px-2 py-1 text-[11px] text-ink-700 hover:bg-highlight"
                          >
                            Retry mark
                          </button>
                        </form>
                      </div>
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

function ReviewGateCell({ metadata }: { metadata: Json | null }) {
  const latest = readLatestReviewGate(metadata);
  if (!latest) {
    return <span className="text-ink-500">-</span>;
  }
  if (latest.passed) {
    return (
      <span className="inline-flex border border-ink-100 bg-paper-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
        pass
      </span>
    );
  }
  return (
    <div className="flex flex-wrap gap-1">
      {latest.reasons.length === 0 ? (
        <span className="inline-flex border border-ink-100 bg-paper-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
          fail
        </span>
      ) : (
        latest.reasons.map((reason) => (
          <span
            key={reason}
            className="inline-flex border border-ink-100 bg-paper-50 px-2 py-0.5 text-[11px] font-medium text-amber-700"
          >
            {reason}
          </span>
        ))
      )}
    </div>
  );
}

function readLatestReviewGate(metadata: Json | null): {
  passed: boolean;
  reasons: string[];
  qualityScore: number;
} | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const reviewGate = (metadata as Record<string, unknown>).review_gate;
  if (!reviewGate || typeof reviewGate !== "object" || Array.isArray(reviewGate)) {
    return null;
  }
  const latest = (reviewGate as Record<string, unknown>).latest;
  if (!latest || typeof latest !== "object" || Array.isArray(latest)) return null;
  const passed = (latest as Record<string, unknown>).passed;
  const reasons = (latest as Record<string, unknown>).reasons;
  const metrics = (latest as Record<string, unknown>).metrics;
  const qualityScore =
    metrics && typeof metrics === "object" && !Array.isArray(metrics)
      ? Number((metrics as Record<string, unknown>).qualityScore ?? 0)
      : 0;
  return {
    passed: passed === true,
    reasons: Array.isArray(reasons)
      ? reasons.filter((v): v is string => typeof v === "string")
      : [],
    qualityScore: Number.isFinite(qualityScore) ? qualityScore : 0,
  };
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
  status,
  createdAt,
  nowMs,
  metadata,
  reviewNotes,
}: {
  status: string;
  createdAt: string;
  nowMs: number;
  metadata: Json | null;
  reviewNotes: string | null;
}) {
  if (status !== "review_required") {
    return <span className="text-ink-500">-</span>;
  }

  const latest = readLatestReviewGate(metadata);
  const ageHours = Math.floor((nowMs - new Date(createdAt).getTime()) / (60 * 60 * 1000));
  const isSlaRisk = ageHours >= 24;
  const hasLowQuality = latest ? latest.qualityScore < 12 : true;
  const label = isSlaRisk ? `SLA risk (${ageHours}h)` : hasLowQuality ? "Quality rework" : "Review needed";
  const details = latest?.reasons.join(",") || reviewNotes || "manual_review_required";
  return (
    <span
      className={`inline-flex border border-ink-100 bg-paper-50 px-2 py-0.5 text-[11px] font-medium ${isSlaRisk ? "text-danger" : "text-amber-700"}`}
      title={details}
    >
      {label}
    </span>
  );
}
