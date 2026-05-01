import type { Json } from "@/types/database.types";

type MonitorContentItem = {
  id: string;
  type: "blog" | "newsletter";
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
  review_notes: string | null;
  metadata: Json | null;
};

type MonitorRun = {
  run_type: string;
  status: string;
  created_at: string;
  error_summary: string | null;
  metadata: Json | null;
};

type FailureReasonCount = { reason: string; count: number };
type QualityReasonCount = { reason: string; count: number };

export type ContentQualitySnapshot = {
  windowDays: number;
  freshWindowHours: number;
  generatedCount: number;
  publishedCount: number;
  reviewRequiredCount: number;
  sendFailedCount: number;
  avgQualityScore: number;
  minQualityScore: number;
  topQualityIssues: QualityReasonCount[];
  topPublishFailureReasons: FailureReasonCount[];
  freshGeneratedCount: number;
  freshReviewedCount: number;
  freshReviewRequiredCount: number;
  freshAvgQualityScore: number;
  freshMinQualityScore: number;
  freshTopQualityIssues: QualityReasonCount[];
  improvementFocus: string[];
};

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function extractQualityScore(metadata: Json | null): number | null {
  const gate = asObject(asObject(metadata)?.review_gate);
  const latest = asObject(gate?.latest);
  const metrics = asObject(latest?.metrics);
  const score = Number(metrics?.qualityScore ?? NaN);
  return Number.isFinite(score) ? score : null;
}

function extractQualityReasons(metadata: Json | null): string[] {
  const gate = asObject(asObject(metadata)?.review_gate);
  const latest = asObject(gate?.latest);
  const raw = latest?.reasons;
  if (!Array.isArray(raw)) return [];
  return raw.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
}

function extractRunPayload(metadata: Json | null): Record<string, unknown> {
  const root = asObject(metadata);
  const nested = asObject(root?.result);
  return nested ?? root ?? {};
}

function isGeneratedItem(item: MonitorContentItem): boolean {
  const root = asObject(item.metadata);
  const generate = asObject(root?.generate);
  if (!generate) return false;
  const mode = String(generate.mode ?? "");
  return mode === "pack_registry";
}

function parseFailureReasons(run: MonitorRun): string[] {
  const payload = extractRunPayload(run.metadata);
  const failureMessages = payload.failureMessages;
  const out: string[] = [];
  if (run.error_summary?.trim()) {
    out.push(run.error_summary.replace(/^warning:/, "").trim());
  }
  if (Array.isArray(failureMessages)) {
    for (const message of failureMessages) {
      if (typeof message !== "string") continue;
      out.push(message.replace(/^\[[^\]]+\]\s*/, "").trim());
    }
  }
  return out.filter(Boolean);
}

function toCountList(source: Map<string, number>, limit = 5): Array<{ reason: string; count: number }> {
  return Array.from(source.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([reason, count]) => ({ reason, count }));
}

export function buildContentQualitySnapshot(params: {
  items: MonitorContentItem[];
  runs: MonitorRun[];
  nowMs?: number;
  windowDays?: number;
  freshWindowHours?: number;
}): ContentQualitySnapshot {
  const nowMs = params.nowMs ?? Date.now();
  const windowDays = params.windowDays ?? 7;
  const freshWindowHours = params.freshWindowHours ?? 24;
  const cutoffMs = nowMs - windowDays * 24 * 60 * 60 * 1000;
  const freshCutoffMs = nowMs - freshWindowHours * 60 * 60 * 1000;

  const scopedItems = params.items.filter((item) => {
    const createdMs = new Date(item.created_at).getTime();
    return Number.isFinite(createdMs) && createdMs >= cutoffMs;
  });
  const scopedRuns = params.runs.filter((run) => {
    const createdMs = new Date(run.created_at).getTime();
    return Number.isFinite(createdMs) && createdMs >= cutoffMs;
  });
  const freshItems = scopedItems.filter((item) => {
    const createdMs = new Date(item.created_at).getTime();
    return Number.isFinite(createdMs) && createdMs >= freshCutoffMs;
  });
  const freshGeneratedItems = freshItems.filter((item) => isGeneratedItem(item));

  const qualityScores: number[] = [];
  const qualityReasonCounts = new Map<string, number>();
  for (const item of scopedItems) {
    const score = extractQualityScore(item.metadata);
    if (typeof score === "number") qualityScores.push(score);
    for (const reason of extractQualityReasons(item.metadata)) {
      qualityReasonCounts.set(reason, (qualityReasonCounts.get(reason) ?? 0) + 1);
    }
  }

  let generatedCount = 0;
  const publishFailureCounts = new Map<string, number>();
  for (const run of scopedRuns) {
    const payload = extractRunPayload(run.metadata);
    const createdItems = Number(payload.createdItems ?? NaN);
    if (run.run_type === "draft_generate" && Number.isFinite(createdItems)) {
      generatedCount += createdItems;
    }
    if (run.run_type === "publish" || run.run_type === "publish_retry_failed") {
      for (const reason of parseFailureReasons(run)) {
        publishFailureCounts.set(reason, (publishFailureCounts.get(reason) ?? 0) + 1);
      }
    }
  }

  const publishedCount = scopedItems.filter((item) => item.status === "published").length;
  const reviewRequiredCount = scopedItems.filter((item) => item.status === "review_required").length;
  const sendFailedCount = scopedItems.filter((item) => item.status === "send_failed").length;
  const avgQualityScore =
    qualityScores.length > 0
      ? Number((qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length).toFixed(1))
      : 0;
  const minQualityScore = qualityScores.length > 0 ? Math.min(...qualityScores) : 0;

  const topQualityIssues = toCountList(qualityReasonCounts);
  const topPublishFailureReasons = toCountList(publishFailureCounts);
  const freshQualityScores: number[] = [];
  const freshQualityReasonCounts = new Map<string, number>();
  for (const item of freshGeneratedItems) {
    const score = extractQualityScore(item.metadata);
    if (typeof score === "number") freshQualityScores.push(score);
    for (const reason of extractQualityReasons(item.metadata)) {
      freshQualityReasonCounts.set(reason, (freshQualityReasonCounts.get(reason) ?? 0) + 1);
    }
  }
  const freshGeneratedCount = freshGeneratedItems.length;
  const freshReviewedCount = freshGeneratedItems.filter((item) =>
    Boolean(asObject(asObject(item.metadata)?.review_gate)?.latest),
  ).length;
  const freshReviewRequiredCount = freshGeneratedItems.filter(
    (item) => item.status === "review_required",
  ).length;
  const freshAvgQualityScore =
    freshQualityScores.length > 0
      ? Number(
          (
            freshQualityScores.reduce((sum, score) => sum + score, 0) /
            freshQualityScores.length
          ).toFixed(1),
        )
      : 0;
  const freshMinQualityScore =
    freshQualityScores.length > 0 ? Math.min(...freshQualityScores) : 0;
  const freshTopQualityIssues = toCountList(freshQualityReasonCounts);

  const improvementFocus: string[] = [];
  if (freshTopQualityIssues.some((issue) => issue.reason === "low_novelty")) {
    improvementFocus.push(
      "low_novelty 우세 시 topic/newsletter/blog pack의 why-now+비교+반례 프레임을 조정하고 1사이클 후 재검증하세요.",
    );
  }
  if (freshTopQualityIssues.some((issue) => issue.reason === "low_relevance")) {
    improvementFocus.push("source trust_weight 상위 소스만 우선 사용하도록 ingest 필터를 강화하세요.");
  }
  if (freshTopQualityIssues.some((issue) => issue.reason === "body_too_short")) {
    improvementFocus.push("draft_generate에서 최소 본문 길이 계약을 늘리고, source bullet을 3개 이상 강제하세요.");
  }
  if (sendFailedCount > 0 || topPublishFailureReasons.length > 0) {
    improvementFocus.push("publish 배치 간격과 retry 윈도우를 운영 트래픽에 맞게 조정하세요.");
  }
  if (reviewRequiredCount >= 5) {
    improvementFocus.push("review_required backlog SLA를 설정하고 must-review 항목을 우선 처리하세요.");
  }
  if (improvementFocus.length === 0) {
    improvementFocus.push("현재 품질/발송 지표가 안정적입니다. 주 1회 팩 실험만 유지하세요.");
  }

  return {
    windowDays,
    freshWindowHours,
    generatedCount,
    publishedCount,
    reviewRequiredCount,
    sendFailedCount,
    avgQualityScore,
    minQualityScore,
    topQualityIssues,
    topPublishFailureReasons,
    freshGeneratedCount,
    freshReviewedCount,
    freshReviewRequiredCount,
    freshAvgQualityScore,
    freshMinQualityScore,
    freshTopQualityIssues,
    improvementFocus,
  };
}

