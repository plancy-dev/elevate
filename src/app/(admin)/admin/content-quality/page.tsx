import Link from "next/link";
import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";
import {
  listAdminContentQueue,
  listAdminContentRuns,
} from "@/actions/admin-content-ops";
import { buildContentQualitySnapshot } from "@/lib/content-ops/quality-monitor";
import type { Json } from "@/types/database.types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Dashboard.adminContentQuality");
  return {
    title: t("metaTitle"),
  };
}

export default async function AdminContentQualityPage() {
  const t = await getTranslations("Dashboard.adminContentQuality");
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
          <h1 className="truncate text-sm font-medium text-ink-900">{t("title")}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/runs" className="text-xs text-ink-700 transition-colors hover:text-ink-900">
            {t("links.runs")}
          </Link>
          <Link href="/admin" className="text-xs text-vermilion-600 transition-colors hover:text-vermilion-700">
            {t("links.backToAdmin")}
          </Link>
        </div>
      </div>

      <div className="max-w-6xl space-y-5 p-6">
        <p className="text-sm leading-relaxed text-ink-700">{t("intro")}</p>

        <div className="grid gap-2 md:grid-cols-5">
          <MetricCard label={t("metrics.generated7d")} value={snapshot.generatedCount} tone="neutral" />
          <MetricCard label={t("metrics.published7d")} value={snapshot.publishedCount} tone="success" />
          <MetricCard label={t("metrics.reviewRequired7d")} value={snapshot.reviewRequiredCount} tone="warning" />
          <MetricCard label={t("metrics.sendFailed7d")} value={snapshot.sendFailedCount} tone="danger" />
          <MetricCard
            label={t("metrics.avgQuality")}
            value={`${snapshot.avgQualityScore} / 25`}
            tone="neutral"
          />
        </div>

        <div className="grid gap-2 md:grid-cols-5">
          <MetricCard label={t("metrics.generated24h")} value={snapshot.freshGeneratedCount} tone="neutral" />
          <MetricCard label={t("metrics.reviewed24h")} value={snapshot.freshReviewedCount} tone="success" />
          <MetricCard
            label={t("metrics.reviewRequired24h")}
            value={snapshot.freshReviewRequiredCount}
            tone="warning"
          />
          <MetricCard
            label={t("metrics.avgQuality24h")}
            value={`${snapshot.freshAvgQualityScore} / 25`}
            tone="neutral"
          />
          <MetricCard
            label={t("metrics.minQuality24h")}
            value={snapshot.freshMinQualityScore}
            tone={snapshot.freshMinQualityScore < 12 ? "danger" : "success"}
          />
        </div>
        <p className="text-[11px] text-ink-500">
          {t("freshNote.prefix")} <code>generate.mode=pack_registry</code> {t("freshNote.suffix")}
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <section className="border border-ink-100 bg-paper-0 p-4">
            <h2 className="text-xs font-medium uppercase tracking-wide text-ink-700">
              {t("sections.topQualityIssues7d")}
            </h2>
            {snapshot.topQualityIssues.length === 0 ? (
              <p className="mt-2 text-xs text-ink-500">{t("empty.topQualityIssues7d")}</p>
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
              {t("sections.topPublishFailures7d")}
            </h2>
            {snapshot.topPublishFailureReasons.length === 0 ? (
              <p className="mt-2 text-xs text-ink-500">{t("empty.topPublishFailures7d")}</p>
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
            {t("sections.topQualityIssuesFresh24h")}
          </h2>
          {snapshot.freshTopQualityIssues.length === 0 ? (
            <p className="mt-2 text-xs text-ink-500">{t("empty.topQualityIssuesFresh24h")}</p>
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
            {t("sections.improvementFocus")}
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
                <th className="p-2 font-medium text-ink-700">{t("table.columns.type")}</th>
                <th className="p-2 font-medium text-ink-700">{t("table.columns.status")}</th>
                <th className="p-2 font-medium text-ink-700">{t("table.columns.quality")}</th>
                <th className="p-2 font-medium text-ink-700">{t("table.columns.reasons")}</th>
                <th className="p-2 font-medium text-ink-700">{t("table.columns.title")}</th>
              </tr>
            </thead>
            <tbody>
              {lowQualityItems.length === 0 ? (
                <tr>
                  <td className="p-3 text-ink-500" colSpan={5}>
                    {t("empty.lowQualityCandidates")}
                  </td>
                </tr>
              ) : (
                lowQualityItems.map((item) => (
                  <tr key={item.id} className="border-b border-ink-100/80">
                    <td className="p-2 text-ink-900">{toTypeLabel(t, item.type)}</td>
                    <td className="p-2 text-ink-700">{toStatusLabel(t, item.status)}</td>
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

function toTypeLabel(t: (key: string) => string, type: string) {
  if (type === "blog") return t("type.blog");
  if (type === "newsletter") return t("type.newsletter");
  return type;
}

function toStatusLabel(t: (key: string) => string, status: string) {
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

