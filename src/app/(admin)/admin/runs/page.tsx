import Link from "next/link";
import type { Metadata } from "next";
import { Activity } from "lucide-react";
import {
  createManualContentRun,
  listAdminContentRuns,
  runAdminContentOpsScenario,
} from "@/actions/admin-content-ops";
import type { Json } from "@/types/database.types";

export const metadata: Metadata = {
  title: "Admin | Automation Runs",
};

export default async function AdminRunsPage() {
  const listRes = await listAdminContentRuns();
  const rows = listRes.ok ? listRes.rows : [];

  return (
    <div className="min-h-screen bg-paper-50">
      <div className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-ink-100 bg-paper-50 px-6">
        <div className="flex min-w-0 items-center gap-2">
          <Activity className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          <h1 className="truncate text-sm font-medium text-ink-900">Automation Runs</h1>
        </div>
        <Link
          href="/admin"
          className="text-xs text-vermilion-600 transition-colors hover:text-vermilion-700"
        >
          Back to admin
        </Link>
      </div>

      <div className="max-w-5xl space-y-5 p-6">
        <p className="text-sm leading-relaxed text-ink-700">
          Inspect ingestion/generation/publish run history and trigger manual runs.
        </p>
        <div className="border border-ink-100 bg-paper-0 p-3 text-xs leading-relaxed text-ink-700">
          <p className="font-medium text-ink-900">Recommended 1-pass scenario</p>
          <p className="mt-1">
            Run in order: <code>ingest</code> {"->"} <code>draft_generate</code> {"->"}{" "}
            <code>publish</code>. If <code>Error</code> shows <code>warning:</code>,
            open the metadata summary in this table for failure details.
          </p>
        </div>

        <form action={createManualContentRun} className="flex flex-wrap items-end gap-2 border border-ink-100 bg-paper-0 p-3">
          <div className="space-y-1">
            <label htmlFor="run_type" className="text-xs text-ink-500">
              Run type
            </label>
            <select
              id="run_type"
              name="run_type"
              defaultValue="ingest"
              className="min-w-[180px] border border-ink-100 bg-paper-50 px-2 py-1.5 text-xs text-ink-900"
            >
              <option value="ingest">ingest</option>
              <option value="draft_generate">draft_generate</option>
              <option value="review_gate">review_gate</option>
              <option value="publish">publish</option>
            </select>
          </div>
          <button
            type="submit"
            className="border border-ink-100 bg-paper-50 px-3 py-1.5 text-xs text-ink-900 hover:bg-highlight"
          >
            Queue manual run
          </button>
          <button
            type="submit"
            formAction={runAdminContentOpsScenario}
            className="border border-ink-100 bg-vermilion-100/40 px-3 py-1.5 text-xs text-ink-900 hover:bg-vermilion-100"
          >
            Run ingest → generate → publish
          </button>
        </form>

        {!listRes.ok ? <p className="text-xs text-danger">{listRes.error}</p> : null}

        {rows.length === 0 ? (
          <p className="text-xs text-ink-500">No run logs yet.</p>
        ) : (
          <div className="overflow-x-auto border border-ink-100">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-ink-100 bg-paper-50">
                  <th className="p-2 font-medium text-ink-700">Type</th>
                  <th className="p-2 font-medium text-ink-700">Result</th>
                  <th className="p-2 font-medium text-ink-700">Status</th>
                  <th className="p-2 font-medium text-ink-700">Trigger</th>
                  <th className="p-2 font-medium text-ink-700">Started</th>
                  <th className="p-2 font-medium text-ink-700">Ended</th>
                  <th className="p-2 font-medium text-ink-700">Error</th>
                  <th className="p-2 font-medium text-ink-700">Metadata</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-ink-100/80">
                    <td className="p-2 text-ink-900">{row.run_type}</td>
                    <td className="p-2">{renderRunResultBadge(row.status, row.error_summary, row.metadata)}</td>
                    <td className="p-2 text-ink-700">{row.status}</td>
                    <td className="p-2 text-ink-700">{row.trigger_type}</td>
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
                    <td className="p-2 text-danger">{row.error_summary ?? "-"}</td>
                    <td className="p-2 text-ink-500">
                      <pre className="max-w-[340px] overflow-x-auto whitespace-pre-wrap wrap-break-word text-[11px] leading-relaxed">
                        {row.metadata ? JSON.stringify(row.metadata) : "-"}
                      </pre>
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

function renderRunResultBadge(
  status: string,
  errorSummary: string | null,
  metadata: Json | null,
) {
  const result = getRunResult(status, errorSummary, metadata);
  const failureHint = getFirstFailureMessage(errorSummary, metadata);
  if (result === "failure") {
    return (
      <span
        className="inline-flex border border-ink-100 bg-paper-50 px-2 py-0.5 text-[11px] font-medium text-danger"
        title={failureHint ?? undefined}
      >
        실패
      </span>
    );
  }
  if (result === "partial") {
    return (
      <span
        className="inline-flex border border-ink-100 bg-paper-50 px-2 py-0.5 text-[11px] font-medium text-amber-700"
        title={failureHint ?? "부분실패 (상세는 metadata 확인)"}
      >
        부분실패
      </span>
    );
  }
  return (
    <span className="inline-flex border border-ink-100 bg-paper-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
      성공
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

function getFirstFailureMessage(
  errorSummary: string | null,
  metadata: Json | null,
): string | null {
  if (errorSummary?.trim()) return errorSummary.trim();
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }
  const obj = metadata as Record<string, unknown>;
  const direct = firstStringInFailureMessages(obj.failureMessages);
  if (direct) return direct;
  const nestedResult = obj.result;
  if (
    nestedResult &&
    typeof nestedResult === "object" &&
    !Array.isArray(nestedResult)
  ) {
    const nested = nestedResult as Record<string, unknown>;
    const nestedMsg = firstStringInFailureMessages(nested.failureMessages);
    if (nestedMsg) return nestedMsg;
  }
  return null;
}

function firstStringInFailureMessages(value: unknown): string | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const first = value.find((item) => typeof item === "string");
  return typeof first === "string" ? first : null;
}
