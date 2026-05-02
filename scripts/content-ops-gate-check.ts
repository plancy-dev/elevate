import dotenv from "dotenv";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildContentQualitySnapshot } from "@/lib/content-ops/quality-monitor";

dotenv.config({ path: ".env.local" });

type GateStatus = "PASS" | "PENDING" | "FAIL";

type GateVerdict = {
  status: GateStatus;
  decision_reason: string;
  evidence: Record<string, number | string | boolean | null>;
};

type WindowBoundaries = {
  nowMs: number;
  current24hStartMs: number;
  previous24hStartMs: number;
};

function toWindowBoundaries(nowMs: number): WindowBoundaries {
  const dayMs = 24 * 60 * 60 * 1000;
  return {
    nowMs,
    current24hStartMs: nowMs - dayMs,
    previous24hStartMs: nowMs - dayMs * 2,
  };
}

function inRange(createdAt: string, startMs: number, endMs: number): boolean {
  const ms = Date.parse(createdAt);
  return Number.isFinite(ms) && ms >= startMs && ms < endMs;
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function extractReviewReasons(metadata: unknown): string[] {
  const root = asObject(metadata);
  const latest =
    asObject(asObject(root?.review_gate)?.latest) ??
    asObject(asObject(root?.reviewGate)?.latest);
  const reasons = latest?.reasons;
  if (!Array.isArray(reasons)) return [];
  return reasons.filter((entry): entry is string => typeof entry === "string");
}

function ratio(num: number, den: number): number {
  if (den <= 0) return 0;
  return Number((num / den).toFixed(4));
}

function buildGate49Verdict(params: {
  resendNotConfigured24: number;
  failed24: number;
  failedPrevious24: number;
}): GateVerdict {
  const nearZeroConfigFailure = params.resendNotConfigured24 <= 1;
  const sendFailedDecayed = params.failed24 <= params.failedPrevious24;
  if (nearZeroConfigFailure && sendFailedDecayed) {
    return {
      status: "PASS",
      decision_reason: "resend_not_configured is near-zero and failed publications are not increasing.",
      evidence: {
        resendNotConfigured24: params.resendNotConfigured24,
        failed24: params.failed24,
        failedPrevious24: params.failedPrevious24,
        sendFailedDecayed,
      },
    };
  }
  if (params.resendNotConfigured24 > 3) {
    return {
      status: "FAIL",
      decision_reason: "resend_not_configured remains dominant in the strict 24h window.",
      evidence: {
        resendNotConfigured24: params.resendNotConfigured24,
        failed24: params.failed24,
        failedPrevious24: params.failedPrevious24,
        sendFailedDecayed,
      },
    };
  }
  return {
    status: "PENDING",
    decision_reason: "config-stop failures are reduced but strict 24h closure criteria are not yet met.",
    evidence: {
      resendNotConfigured24: params.resendNotConfigured24,
      failed24: params.failed24,
      failedPrevious24: params.failedPrevious24,
      sendFailedDecayed,
    },
  };
}

function buildGate50Verdict(params: {
  retryExhausted24: number;
  retryExhaustedPrevious24: number;
  failRatio24: number;
}): GateVerdict {
  const retryWasteStable = params.retryExhausted24 <= params.retryExhaustedPrevious24;
  const failRatioTargetMet = params.failRatio24 < 20;
  if (retryWasteStable && failRatioTargetMet) {
    return {
      status: "PASS",
      decision_reason: "retry_exhausted is controlled and fail ratio is below 20%.",
      evidence: {
        retryExhausted24: params.retryExhausted24,
        retryExhaustedPrevious24: params.retryExhaustedPrevious24,
        failRatio24: params.failRatio24,
      },
    };
  }
  if (!retryWasteStable) {
    return {
      status: "FAIL",
      decision_reason: "retry_exhausted increased versus previous 24h window.",
      evidence: {
        retryExhausted24: params.retryExhausted24,
        retryExhaustedPrevious24: params.retryExhaustedPrevious24,
        failRatio24: params.failRatio24,
      },
    };
  }
  return {
    status: "PENDING",
    decision_reason: "retry waste is controlled but fail ratio remains above closure threshold.",
    evidence: {
      retryExhausted24: params.retryExhausted24,
      retryExhaustedPrevious24: params.retryExhaustedPrevious24,
      failRatio24: params.failRatio24,
    },
  };
}

function buildGate51Verdict(params: {
  lowNoveltyRatio24: number;
  lowNoveltyRatioPrevious24: number;
  blogReviewRequiredRatio24: number;
  blogReviewRequiredRatioPrevious24: number;
  sampleCount24: number;
}): GateVerdict {
  const lowNoveltyImproved = params.lowNoveltyRatio24 < params.lowNoveltyRatioPrevious24;
  const blogReviewImproved =
    params.blogReviewRequiredRatio24 < params.blogReviewRequiredRatioPrevious24;
  const hasSample = params.sampleCount24 >= 5;
  if (hasSample && lowNoveltyImproved && blogReviewImproved) {
    return {
      status: "PASS",
      decision_reason: "low_novelty and blog review_required ratios both improved in current window.",
      evidence: {
        lowNoveltyRatio24: params.lowNoveltyRatio24,
        lowNoveltyRatioPrevious24: params.lowNoveltyRatioPrevious24,
        blogReviewRequiredRatio24: params.blogReviewRequiredRatio24,
        blogReviewRequiredRatioPrevious24: params.blogReviewRequiredRatioPrevious24,
        sampleCount24: params.sampleCount24,
      },
    };
  }
  if (!hasSample) {
    return {
      status: "PENDING",
      decision_reason: "insufficient 24h sample size for novelty closure decision.",
      evidence: {
        lowNoveltyRatio24: params.lowNoveltyRatio24,
        lowNoveltyRatioPrevious24: params.lowNoveltyRatioPrevious24,
        blogReviewRequiredRatio24: params.blogReviewRequiredRatio24,
        blogReviewRequiredRatioPrevious24: params.blogReviewRequiredRatioPrevious24,
        sampleCount24: params.sampleCount24,
      },
    };
  }
  return {
    status: "PENDING",
    decision_reason: "full-cycle novelty improvement is not confirmed yet.",
    evidence: {
      lowNoveltyRatio24: params.lowNoveltyRatio24,
      lowNoveltyRatioPrevious24: params.lowNoveltyRatioPrevious24,
      blogReviewRequiredRatio24: params.blogReviewRequiredRatio24,
      blogReviewRequiredRatioPrevious24: params.blogReviewRequiredRatioPrevious24,
      sampleCount24: params.sampleCount24,
    },
  };
}

async function main() {
  const admin = createAdminClient();
  const nowMs = Date.now();
  const windows = toWindowBoundaries(nowMs);
  const [itemsRes, runsRes, publicationsRes] = await Promise.all([
    admin
      .from("content_items")
      .select("id,type,status,created_at,metadata")
      .order("created_at", { ascending: false })
      .limit(1500),
    admin
      .from("content_runs")
      .select("run_type,status,created_at,error_summary,metadata")
      .order("created_at", { ascending: false })
      .limit(1000),
    admin
      .from("content_publications")
      .select("status,last_error,created_at")
      .order("created_at", { ascending: false })
      .limit(3000),
  ]);

  if (itemsRes.error) throw new Error(`content_items_query_failed:${itemsRes.error.message}`);
  if (runsRes.error) throw new Error(`content_runs_query_failed:${runsRes.error.message}`);
  if (publicationsRes.error) {
    throw new Error(`content_publications_query_failed:${publicationsRes.error.message}`);
  }

  const items = (itemsRes.data ?? []) as Array<{
    type: "blog" | "newsletter";
    status: string;
    created_at: string;
    metadata: unknown;
  }>;
  const runs = (runsRes.data ?? []) as Array<{
    run_type: string;
    status: string;
    created_at: string;
    error_summary: string | null;
    metadata: unknown;
  }>;
  const publications = (publicationsRes.data ?? []) as Array<{
    status: string;
    last_error: string | null;
    created_at: string;
  }>;

  const current24hPubs = publications.filter((row) =>
    inRange(row.created_at, windows.current24hStartMs, windows.nowMs),
  );
  const previous24hPubs = publications.filter((row) =>
    inRange(row.created_at, windows.previous24hStartMs, windows.current24hStartMs),
  );

  const failed24 = current24hPubs.filter((row) => row.status === "failed").length;
  const failedPrevious24 = previous24hPubs.filter((row) => row.status === "failed").length;
  const failRatio24 = ratio(failed24 * 100, current24hPubs.length);
  const resendNotConfigured24 = current24hPubs.filter((row) =>
    typeof row.last_error === "string" && row.last_error.includes("resend_not_configured"),
  ).length;
  const retryExhausted24 = current24hPubs.filter((row) =>
    typeof row.last_error === "string" && row.last_error.includes("retry_exhausted"),
  ).length;
  const retryExhaustedPrevious24 = previous24hPubs.filter((row) =>
    typeof row.last_error === "string" && row.last_error.includes("retry_exhausted"),
  ).length;

  const current24hItems = items.filter((row) =>
    inRange(row.created_at, windows.current24hStartMs, windows.nowMs),
  );
  const previous24hItems = items.filter((row) =>
    inRange(row.created_at, windows.previous24hStartMs, windows.current24hStartMs),
  );

  const currentLowNovelty = current24hItems.filter((row) =>
    extractReviewReasons(row.metadata).includes("low_novelty"),
  ).length;
  const previousLowNovelty = previous24hItems.filter((row) =>
    extractReviewReasons(row.metadata).includes("low_novelty"),
  ).length;
  const lowNoveltyRatio24 = ratio(currentLowNovelty, current24hItems.length);
  const lowNoveltyRatioPrevious24 = ratio(previousLowNovelty, previous24hItems.length);

  const currentBlogs = current24hItems.filter((row) => row.type === "blog");
  const previousBlogs = previous24hItems.filter((row) => row.type === "blog");
  const blogReviewRequiredRatio24 = ratio(
    currentBlogs.filter((row) => row.status === "review_required").length,
    currentBlogs.length,
  );
  const blogReviewRequiredRatioPrevious24 = ratio(
    previousBlogs.filter((row) => row.status === "review_required").length,
    previousBlogs.length,
  );

  const snapshot = buildContentQualitySnapshot({
    items: (itemsRes.data ?? []) as never[],
    runs: (runs as never[]) ?? [],
  });

  const gate49 = buildGate49Verdict({
    resendNotConfigured24,
    failed24,
    failedPrevious24,
  });
  const gate50 = buildGate50Verdict({
    retryExhausted24,
    retryExhaustedPrevious24,
    failRatio24,
  });
  const gate51 = buildGate51Verdict({
    lowNoveltyRatio24,
    lowNoveltyRatioPrevious24,
    blogReviewRequiredRatio24,
    blogReviewRequiredRatioPrevious24,
    sampleCount24: current24hItems.length,
  });

  const output = {
    generatedAt: new Date(nowMs).toISOString(),
    windows: {
      current24hStart: new Date(windows.current24hStartMs).toISOString(),
      previous24hStart: new Date(windows.previous24hStartMs).toISOString(),
      now: new Date(windows.nowMs).toISOString(),
    },
    metrics: {
      publications: {
        total24h: current24hPubs.length,
        failed24,
        failedPrevious24,
        failRatio24,
        resendNotConfigured24,
        retryExhausted24,
        retryExhaustedPrevious24,
      },
      novelty: {
        sampleCount24: current24hItems.length,
        lowNoveltyRatio24,
        lowNoveltyRatioPrevious24,
        blogReviewRequiredRatio24,
        blogReviewRequiredRatioPrevious24,
      },
      qualitySnapshot: {
        sendFailedCount7d: snapshot.sendFailedCount,
        deferredCount7d: snapshot.deferredCount,
        citationCoverage7dAvg: snapshot.citationCoverage7dAvg,
      },
    },
    gates: {
      gate49,
      gate50,
      gate51,
    },
  };

  console.log(JSON.stringify(output, null, 2));
  console.log("");
  console.log("# Gate Summary");
  console.log(`- #49: ${gate49.status} — ${gate49.decision_reason}`);
  console.log(`- #50: ${gate50.status} — ${gate50.decision_reason}`);
  console.log(`- #51: ${gate51.status} — ${gate51.decision_reason}`);
}

main().catch((error) => {
  console.error("[content-ops-gate-check] failed:", error);
  process.exit(1);
});
