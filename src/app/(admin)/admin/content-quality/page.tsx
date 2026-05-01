import Link from "next/link";
import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import {
  listAdminContentQueue,
  listAdminContentRuns,
} from "@/actions/admin-content-ops";
import { buildContentQualitySnapshot } from "@/lib/content-ops/quality-monitor";
import type { Json } from "@/types/database.types";

export const metadata: Metadata = {
  title: "Admin | Content Quality Monitor",
};

export default async function AdminContentQualityPage() {
  const queueRes = await listAdminContentQueue({ type: "all", status: "all" });
  const runsRes = await listAdminContentRuns();

  const items = queueRes.ok ? queueRes.rows : [];
  const runs = runsRes.ok ? runsRes.rows : [];
  const snapshot = buildContentQualitySnapshot({
    items,
    runs,
    windowDays: 7,
    freshWindowHours: 24,
  });
  const lowQualityItems = buildLowQualityItems(items).slice(0, 12);

  return (
    <div className="min-h-screen bg-paper-50">
      <div className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-ink-100 bg-paper-50 px-6">
        <div className="flex min-w-0 items-center gap-2">
          <Sparkles className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          <h1 className="truncate text-sm font-medium text-ink-900">Content Quality Monitor</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/runs" className="text-xs text-ink-700 transition-colors hover:text-ink-900">
            Runs
          </Link>
          <Link href="/admin" className="text-xs text-vermilion-600 transition-colors hover:text-vermilion-700">
            Back to admin
          </Link>
        </div>
      </div>

      <div className="max-w-6xl space-y-5 p-6">
        <p className="text-sm leading-relaxed text-ink-700">
          주간 품질/발송 지표를 기반으로 생성-검수-개선 루프를 운영합니다. 이 화면을 기준으로
          팩 수정, 리뷰 우선순위, 발행 안정화 액션을 결정하세요.
        </p>

        <div className="grid gap-2 md:grid-cols-5">
          <MetricCard label="7d generated" value={snapshot.generatedCount} tone="neutral" />
          <MetricCard label="7d published" value={snapshot.publishedCount} tone="success" />
          <MetricCard label="7d review_required" value={snapshot.reviewRequiredCount} tone="warning" />
          <MetricCard label="7d send_failed" value={snapshot.sendFailedCount} tone="danger" />
          <MetricCard
            label="avg quality score"
            value={`${snapshot.avgQualityScore} / 25`}
            tone="neutral"
          />
        </div>

        <div className="grid gap-2 md:grid-cols-5">
          <MetricCard label="24h generated" value={snapshot.freshGeneratedCount} tone="neutral" />
          <MetricCard label="24h reviewed" value={snapshot.freshReviewedCount} tone="success" />
          <MetricCard
            label="24h review_required"
            value={snapshot.freshReviewRequiredCount}
            tone="warning"
          />
          <MetricCard
            label="24h avg quality"
            value={`${snapshot.freshAvgQualityScore} / 25`}
            tone="neutral"
          />
          <MetricCard
            label="24h min quality"
            value={snapshot.freshMinQualityScore}
            tone={snapshot.freshMinQualityScore < 12 ? "danger" : "success"}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <section className="border border-ink-100 bg-paper-0 p-4">
            <h2 className="text-xs font-medium uppercase tracking-wide text-ink-700">
              Top Quality Issues (7d)
            </h2>
            {snapshot.topQualityIssues.length === 0 ? (
              <p className="mt-2 text-xs text-ink-500">No quality issues detected in this window.</p>
            ) : (
              <ul className="mt-2 space-y-1 text-xs text-ink-700">
                {snapshot.topQualityIssues.map((issue) => (
                  <li key={issue.reason} className="flex items-center justify-between gap-3">
                    <span>{issue.reason}</span>
                    <span className="text-ink-500">{issue.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="border border-ink-100 bg-paper-0 p-4">
            <h2 className="text-xs font-medium uppercase tracking-wide text-ink-700">
              Top Publish Failures (7d)
            </h2>
            {snapshot.topPublishFailureReasons.length === 0 ? (
              <p className="mt-2 text-xs text-ink-500">No publish failures detected in this window.</p>
            ) : (
              <ul className="mt-2 space-y-1 text-xs text-ink-700">
                {snapshot.topPublishFailureReasons.map((issue) => (
                  <li key={issue.reason} className="flex items-center justify-between gap-3">
                    <span className="truncate">{issue.reason}</span>
                    <span className="shrink-0 text-ink-500">{issue.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section className="border border-ink-100 bg-paper-0 p-4">
          <h2 className="text-xs font-medium uppercase tracking-wide text-ink-700">
            Top Quality Issues (Fresh 24h only)
          </h2>
          {snapshot.freshTopQualityIssues.length === 0 ? (
            <p className="mt-2 text-xs text-ink-500">No quality issues detected in fresh generated content.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-xs text-ink-700">
              {snapshot.freshTopQualityIssues.map((issue) => (
                <li key={issue.reason} className="flex items-center justify-between gap-3">
                  <span>{issue.reason}</span>
                  <span className="text-ink-500">{issue.count}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="border border-ink-100 bg-paper-0 p-4">
          <h2 className="text-xs font-medium uppercase tracking-wide text-ink-700">
            Improvement Focus (Auto Suggestions)
          </h2>
          <ul className="mt-2 space-y-1 text-xs leading-relaxed text-ink-700">
            {snapshot.improvementFocus.map((focus) => (
              <li key={focus}>- {focus}</li>
            ))}
          </ul>
        </section>

        <section className="overflow-x-auto border border-ink-100">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-ink-100 bg-paper-50">
                <th className="p-2 font-medium text-ink-700">Type</th>
                <th className="p-2 font-medium text-ink-700">Status</th>
                <th className="p-2 font-medium text-ink-700">Quality</th>
                <th className="p-2 font-medium text-ink-700">Reasons</th>
                <th className="p-2 font-medium text-ink-700">Title</th>
              </tr>
            </thead>
            <tbody>
              {lowQualityItems.length === 0 ? (
                <tr>
                  <td className="p-3 text-ink-500" colSpan={5}>
                    Low-quality candidates not found.
                  </td>
                </tr>
              ) : (
                lowQualityItems.map((item) => (
                  <tr key={item.id} className="border-b border-ink-100/80">
                    <td className="p-2 text-ink-900">{item.type}</td>
                    <td className="p-2 text-ink-700">{item.status}</td>
                    <td className="p-2 text-ink-700">{item.qualityScore}</td>
                    <td className="p-2 text-ink-700">{item.reasons.join(", ") || "-"}</td>
                    <td className="p-2 text-ink-900">{item.title}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: "neutral" | "success" | "warning" | "danger";
}) {
  const toneClass =
    tone === "success"
      ? "text-emerald-700"
      : tone === "warning"
        ? "text-amber-700"
        : tone === "danger"
          ? "text-danger"
          : "text-ink-900";
  return (
    <div className="border border-ink-100 bg-paper-0 p-3">
      <p className="text-[11px] uppercase tracking-wide text-ink-500">{label}</p>
      <p className={`mt-1 text-sm font-medium ${toneClass}`}>{String(value)}</p>
    </div>
  );
}

function buildLowQualityItems(
  rows: Array<{
    id: string;
    type: "blog" | "newsletter";
    status: string;
    title: string;
    metadata: Json | null;
  }>,
) {
  const out: Array<{
    id: string;
    type: "blog" | "newsletter";
    status: string;
    title: string;
    qualityScore: number;
    reasons: string[];
  }> = [];
  for (const row of rows) {
    const gate = asObject(asObject(row.metadata)?.review_gate);
    const latest = asObject(gate?.latest);
    const metrics = asObject(latest?.metrics);
    const qualityScore = Number(metrics?.qualityScore ?? NaN);
    const reasonsRaw = latest?.reasons;
    const reasons = Array.isArray(reasonsRaw)
      ? reasonsRaw.filter((v): v is string => typeof v === "string")
      : [];
    if (!Number.isFinite(qualityScore)) continue;
    if (qualityScore >= 20 && reasons.length === 0) continue;
    out.push({
      id: row.id,
      type: row.type,
      status: row.status,
      title: row.title,
      qualityScore,
      reasons,
    });
  }
  return out.sort((a, b) => a.qualityScore - b.qualityScore);
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

