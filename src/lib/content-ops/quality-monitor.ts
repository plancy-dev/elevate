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
type StrategyScoreRow = {
  strategy: "novelty_boost" | "overcopy_mitigate" | "balanced";
  sampleCount: number;
  avgQualityScore: number;
  reviewRequiredRatio: number;
};
type ThreeDayRegression = {
  triggered: boolean;
  metric: "review_required" | "send_failed" | null;
  series: Array<{ day: string; reviewRequiredCount: number; sendFailedCount: number }>;
  reason: string | null;
  nextAction: string | null;
};
type WindowDelta = {
  current: number;
  previous: number;
  deltaPercent: number | null;
};

export type ContentQualitySnapshot = {
  windowDays: number;
  freshWindowHours: number;
  generatedCount: number;
  publishedCount: number;
  reviewRequiredCount: number;
  sendFailedCount: number;
  deferredCount: number;
  citationCoverage7dAvg: number;
  avgQualityScore: number;
  minQualityScore: number;
  topQualityIssues: QualityReasonCount[];
  topPublishFailureReasons: FailureReasonCount[];
  freshGeneratedCount: number;
  freshReviewedCount: number;
  freshReviewRequiredCount: number;
  citationCoverage24hAvg: number;
  freshAvgQualityScore: number;
  freshMinQualityScore: number;
  freshTopQualityIssues: QualityReasonCount[];
  generated7dDelta: WindowDelta;
  generated24hDelta: WindowDelta;
  strategyScoreboard: StrategyScoreRow[];
  winnerStrategy: StrategyScoreRow["strategy"] | null;
  strategyMinSampleSize: number;
  hasInsufficientStrategySample: boolean;
  threeDayRegression: ThreeDayRegression;
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

function extractCitationCoverage(metadata: Json | null): number | null {
  const gate = asObject(asObject(metadata)?.review_gate);
  const latest = asObject(gate?.latest);
  const metrics = asObject(latest?.metrics);
  const coverage = Number(metrics?.citationCoverage ?? NaN);
  return Number.isFinite(coverage) ? coverage : null;
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

function extractAutotuneStrategy(
  metadata: Json | null,
): StrategyScoreRow["strategy"] | null {
  const generate = asObject(asObject(metadata)?.generate);
  const mode = String(generate?.mode ?? "");
  if (mode !== "pack_registry") return null;
  const autotune = asObject(generate?.autotune);
  const strategy = autotune?.strategy;
  if (
    strategy === "novelty_boost" ||
    strategy === "overcopy_mitigate" ||
    strategy === "balanced"
  ) {
    return strategy;
  }
  return null;
}

function toCountList(source: Map<string, number>, limit = 5): Array<{ reason: string; count: number }> {
  return Array.from(source.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([reason, count]) => ({ reason, count }));
}

function isInWindow(createdMs: number, startMs: number, endMs: number): boolean {
  return Number.isFinite(createdMs) && createdMs >= startMs && createdMs < endMs;
}

function toDeltaPercent(current: number, previous: number): number | null {
  if (previous === 0) {
    return current === 0 ? 0 : null;
  }
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function toUtcDayKey(input: string): string | null {
  const date = new Date(input);
  const time = date.getTime();
  if (!Number.isFinite(time)) return null;
  return date.toISOString().slice(0, 10);
}

function buildThreeDayRegression(items: MonitorContentItem[], nowMs: number): ThreeDayRegression {
  const todayKey = new Date(nowMs).toISOString().slice(0, 10);
  const byDay = new Map<string, { reviewRequiredCount: number; sendFailedCount: number }>();
  for (const item of items) {
    const day = toUtcDayKey(item.created_at);
    if (!day || day >= todayKey) continue;
    const prev = byDay.get(day) ?? { reviewRequiredCount: 0, sendFailedCount: 0 };
    if (item.status === "review_required") prev.reviewRequiredCount += 1;
    if (item.status === "send_failed") prev.sendFailedCount += 1;
    byDay.set(day, prev);
  }
  const series = Array.from(byDay.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-3)
    .map(([day, counts]) => ({
      day,
      reviewRequiredCount: counts.reviewRequiredCount,
      sendFailedCount: counts.sendFailedCount,
    }));
  if (series.length < 3) {
    return {
      triggered: false,
      metric: null,
      series,
      reason: null,
      nextAction: null,
    };
  }
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
      metric: "review_required",
      series,
      reason: "three_day_review_required_regression",
      nextAction:
        "Pause risky publish retries, tighten review gate thresholds, and assign backlog owner in /admin/morning-ops.",
    };
  }
  if (sendFailedTriggered) {
    return {
      triggered: true,
      metric: "send_failed",
      series,
      reason: "three_day_send_failed_regression",
      nextAction:
        "Run failure-class triage first, then execute retry-only window with reduced batch size.",
    };
  }
  return {
    triggered: false,
    metric: null,
    series,
    reason: null,
    nextAction: null,
  };
}

export function buildContentQualitySnapshot(params: {
  items: MonitorContentItem[];
  runs: MonitorRun[];
  nowMs?: number;
  windowDays?: number;
  freshWindowHours?: number;
}): ContentQualitySnapshot {
  const strategyMinSampleSize = 20;
  const nowMs = params.nowMs ?? Date.now();
  const windowDays = params.windowDays ?? 7;
  const freshWindowHours = params.freshWindowHours ?? 24;
  const dayMs = 24 * 60 * 60 * 1000;
  const hourMs = 60 * 60 * 1000;
  const windowMs = windowDays * dayMs;
  const freshWindowMs = freshWindowHours * hourMs;
  const windowCurrentStartMs = nowMs - windowMs;
  const windowPreviousStartMs = nowMs - windowMs * 2;
  const freshCurrentStartMs = nowMs - freshWindowMs;
  const freshPreviousStartMs = nowMs - freshWindowMs * 2;

  const scopedItems = params.items.filter((item) => {
    const createdMs = new Date(item.created_at).getTime();
    return isInWindow(createdMs, windowCurrentStartMs, nowMs);
  });
  const scopedRuns = params.runs.filter((run) => {
    const createdMs = new Date(run.created_at).getTime();
    return isInWindow(createdMs, windowCurrentStartMs, nowMs);
  });
  const previousWindowRuns = params.runs.filter((run) => {
    const createdMs = new Date(run.created_at).getTime();
    return isInWindow(createdMs, windowPreviousStartMs, windowCurrentStartMs);
  });
  const freshItems = scopedItems.filter((item) => {
    const createdMs = new Date(item.created_at).getTime();
    return isInWindow(createdMs, freshCurrentStartMs, nowMs);
  });
  const previousFreshItems = params.items.filter((item) => {
    const createdMs = new Date(item.created_at).getTime();
    return isInWindow(createdMs, freshPreviousStartMs, freshCurrentStartMs);
  });
  const freshGeneratedItems = freshItems.filter((item) => isGeneratedItem(item));
  const previousFreshGeneratedItems = previousFreshItems.filter((item) => isGeneratedItem(item));

  const qualityScores: number[] = [];
  const citationCoverageScores: number[] = [];
  const qualityReasonCounts = new Map<string, number>();
  for (const item of scopedItems) {
    const score = extractQualityScore(item.metadata);
    if (typeof score === "number") qualityScores.push(score);
    const citationCoverage = extractCitationCoverage(item.metadata);
    if (typeof citationCoverage === "number") citationCoverageScores.push(citationCoverage);
    for (const reason of extractQualityReasons(item.metadata)) {
      qualityReasonCounts.set(reason, (qualityReasonCounts.get(reason) ?? 0) + 1);
    }
  }

  let generatedCount = 0;
  let deferredCount = 0;
  const publishFailureCounts = new Map<string, number>();
  for (const run of scopedRuns) {
    const payload = extractRunPayload(run.metadata);
    const createdItems = Number(payload.createdItems ?? NaN);
    if (run.run_type === "draft_generate" && Number.isFinite(createdItems)) {
      generatedCount += createdItems;
    }
    if (run.run_type === "publish" || run.run_type === "publish_retry_failed") {
      const deferred = Number(payload.deferredCount ?? NaN);
      if (Number.isFinite(deferred)) {
        deferredCount += deferred;
      }
      for (const reason of parseFailureReasons(run)) {
        publishFailureCounts.set(reason, (publishFailureCounts.get(reason) ?? 0) + 1);
      }
    }
  }
  let previousGeneratedCount = 0;
  for (const run of previousWindowRuns) {
    const payload = extractRunPayload(run.metadata);
    const createdItems = Number(payload.createdItems ?? NaN);
    if (run.run_type === "draft_generate" && Number.isFinite(createdItems)) {
      previousGeneratedCount += createdItems;
    }
  }

  const publishedCount = scopedItems.filter((item) => item.status === "published").length;
  const reviewRequiredCount = scopedItems.filter((item) => item.status === "review_required").length;
  const sendFailedCount = scopedItems.filter((item) => item.status === "send_failed").length;
  const citationCoverage7dAvg =
    citationCoverageScores.length > 0
      ? Number(
          (
            citationCoverageScores.reduce((sum, coverage) => sum + coverage, 0) /
            citationCoverageScores.length
          ).toFixed(4),
        )
      : 0;
  const avgQualityScore =
    qualityScores.length > 0
      ? Number((qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length).toFixed(1))
      : 0;
  const minQualityScore = qualityScores.length > 0 ? Math.min(...qualityScores) : 0;

  const topQualityIssues = toCountList(qualityReasonCounts);
  const topPublishFailureReasons = toCountList(publishFailureCounts);
  const freshQualityScores: number[] = [];
  const freshCitationCoverageScores: number[] = [];
  const freshQualityReasonCounts = new Map<string, number>();
  for (const item of freshGeneratedItems) {
    const score = extractQualityScore(item.metadata);
    if (typeof score === "number") freshQualityScores.push(score);
    const citationCoverage = extractCitationCoverage(item.metadata);
    if (typeof citationCoverage === "number") freshCitationCoverageScores.push(citationCoverage);
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
  const citationCoverage24hAvg =
    freshCitationCoverageScores.length > 0
      ? Number(
          (
            freshCitationCoverageScores.reduce((sum, coverage) => sum + coverage, 0) /
            freshCitationCoverageScores.length
          ).toFixed(4),
        )
      : 0;
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
  const generated7dDelta: WindowDelta = {
    current: generatedCount,
    previous: previousGeneratedCount,
    deltaPercent: toDeltaPercent(generatedCount, previousGeneratedCount),
  };
  const generated24hDelta: WindowDelta = {
    current: freshGeneratedCount,
    previous: previousFreshGeneratedItems.length,
    deltaPercent: toDeltaPercent(freshGeneratedCount, previousFreshGeneratedItems.length),
  };
  const strategyBuckets = new Map<
    StrategyScoreRow["strategy"],
    { sampleCount: number; qualityScoreSum: number; reviewRequiredCount: number }
  >();
  for (const item of scopedItems) {
    const strategy = extractAutotuneStrategy(item.metadata);
    if (!strategy) continue;
    const prev = strategyBuckets.get(strategy) ?? {
      sampleCount: 0,
      qualityScoreSum: 0,
      reviewRequiredCount: 0,
    };
    const score = extractQualityScore(item.metadata) ?? 0;
    strategyBuckets.set(strategy, {
      sampleCount: prev.sampleCount + 1,
      qualityScoreSum: prev.qualityScoreSum + score,
      reviewRequiredCount:
        prev.reviewRequiredCount + (item.status === "review_required" ? 1 : 0),
    });
  }
  const strategies: StrategyScoreRow["strategy"][] = [
    "novelty_boost",
    "overcopy_mitigate",
    "balanced",
  ];
  const strategyScoreboard = strategies.map((strategy) => {
    const bucket = strategyBuckets.get(strategy) ?? {
      sampleCount: 0,
      qualityScoreSum: 0,
      reviewRequiredCount: 0,
    };
    const avgQualityScore =
      bucket.sampleCount > 0
        ? Number((bucket.qualityScoreSum / bucket.sampleCount).toFixed(1))
        : 0;
    const reviewRequiredRatio =
      bucket.sampleCount > 0
        ? Number((bucket.reviewRequiredCount / bucket.sampleCount).toFixed(4))
        : 0;
    return {
      strategy,
      sampleCount: bucket.sampleCount,
      avgQualityScore,
      reviewRequiredRatio,
    };
  });
  const hasInsufficientStrategySample = strategyScoreboard.some(
    (row) => row.sampleCount < strategyMinSampleSize,
  );
  const winnerCandidate = [...strategyScoreboard].sort((a, b) => {
    if (b.avgQualityScore !== a.avgQualityScore) {
      return b.avgQualityScore - a.avgQualityScore;
    }
    if (a.reviewRequiredRatio !== b.reviewRequiredRatio) {
      return a.reviewRequiredRatio - b.reviewRequiredRatio;
    }
    return b.sampleCount - a.sampleCount;
  })[0];
  const winnerStrategy =
    winnerCandidate && winnerCandidate.sampleCount > 0 ? winnerCandidate.strategy : null;
  const threeDayRegression = buildThreeDayRegression(params.items, nowMs);

  const improvementFocus: string[] = [];
  if (freshTopQualityIssues.some((issue) => issue.reason === "low_novelty")) {
    improvementFocus.push(
      "low_novelty 우세 시 topic/newsletter/blog pack의 why-now+비교+반례 프레임을 조정하고 1사이클 후 재검증하세요.",
    );
  }
  if (freshTopQualityIssues.some((issue) => issue.reason === "low_relevance")) {
    improvementFocus.push("source trust_weight 상위 소스만 우선 사용하도록 ingest 필터를 강화하세요.");
  }
  if (freshTopQualityIssues.some((issue) => issue.reason === "comparison_missing")) {
    improvementFocus.push("comparison_missing 빈도가 높으면 vs/trade-off 단락을 템플릿 필수 블록으로 강제하세요.");
  }
  if (freshTopQualityIssues.some((issue) => issue.reason === "counterargument_missing")) {
    improvementFocus.push("counterargument_missing이 반복되면 counter-signal/objection 섹션을 생성 프롬프트에 고정하세요.");
  }
  if (freshTopQualityIssues.some((issue) => issue.reason === "evidence_count_insufficient")) {
    improvementFocus.push("evidence_count_insufficient가 높으면 근거 링크/수치 신호 최소 개수 계약을 상향하세요.");
  }
  if (freshTopQualityIssues.some((issue) => issue.reason === "citation_coverage_low")) {
    improvementFocus.push("citation_coverage_low가 반복되면 본문 단락별 출처 인용 밀도 기준을 상향하고 포맷 파서를 보정하세요.");
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
  if (threeDayRegression.triggered && threeDayRegression.nextAction) {
    improvementFocus.push(
      `3일 연속 악화 감지(${threeDayRegression.metric}): ${threeDayRegression.nextAction}`,
    );
  }
  const structuralIssueCount = freshTopQualityIssues
    .filter((issue) =>
      ["comparison_missing", "counterargument_missing", "evidence_count_insufficient"].includes(
        issue.reason,
      ),
    )
    .reduce((sum, issue) => sum + issue.count, 0);
  if (structuralIssueCount > 0 && freshAvgQualityScore >= 18) {
    improvementFocus.push(
      "구조 가드 탐지가 고품질 점수와 함께 증가하면 false-positive 모니터링 대상으로 분리해 수동 샘플 리뷰를 병행하세요.",
    );
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
    deferredCount,
    citationCoverage7dAvg,
    avgQualityScore,
    minQualityScore,
    topQualityIssues,
    topPublishFailureReasons,
    freshGeneratedCount,
    freshReviewedCount,
    freshReviewRequiredCount,
    citationCoverage24hAvg,
    freshAvgQualityScore,
    freshMinQualityScore,
    freshTopQualityIssues,
    generated7dDelta,
    generated24hDelta,
    strategyScoreboard,
    winnerStrategy,
    strategyMinSampleSize,
    hasInsufficientStrategySample,
    threeDayRegression,
    improvementFocus,
  };
}

