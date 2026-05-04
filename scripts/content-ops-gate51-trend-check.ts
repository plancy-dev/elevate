import dotenv from "dotenv";
import { createAdminClient } from "@/lib/supabase/admin";

dotenv.config({ path: ".env.local", quiet: true });

const MIN_DAY_BUCKETS = Number.parseInt(
  process.env.CONTENT_OPS_GATE51_MIN_DAY_BUCKETS ?? "2",
  10,
);
const LOOKBACK_DAYS = Number.parseInt(
  process.env.CONTENT_OPS_GATE51_LOOKBACK_DAYS ?? "7",
  10,
);

type DayBucket = {
  total: number;
  lowNovelty: number;
  blogTotal: number;
  blogReviewRequired: number;
};

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

async function main() {
  const admin = createAdminClient();
  const sinceIso = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await admin
    .from("content_items")
    .select("type,status,created_at,metadata")
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`content_items_query_failed:${error.message}`);

  const byDay = new Map<string, DayBucket>();
  for (const row of data ?? []) {
    const day = new Date(row.created_at).toISOString().slice(0, 10);
    const cur = byDay.get(day) ?? {
      total: 0,
      lowNovelty: 0,
      blogTotal: 0,
      blogReviewRequired: 0,
    };
    cur.total += 1;
    if (extractReviewReasons(row.metadata).includes("low_novelty")) {
      cur.lowNovelty += 1;
    }
    if (row.type === "blog") {
      cur.blogTotal += 1;
      if (row.status === "review_required") cur.blogReviewRequired += 1;
    }
    byDay.set(day, cur);
  }

  const trend = Array.from(byDay.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([day, bucket]) => ({
      day,
      total: bucket.total,
      lowNovelty: bucket.lowNovelty,
      lowNoveltyRatio: bucket.total > 0 ? Number((bucket.lowNovelty / bucket.total).toFixed(4)) : 0,
      blogTotal: bucket.blogTotal,
      blogReviewRequired: bucket.blogReviewRequired,
      blogReviewRequiredRatio:
        bucket.blogTotal > 0
          ? Number((bucket.blogReviewRequired / bucket.blogTotal).toFixed(4))
          : 0,
    }));

  let status: "PASS" | "PENDING" = "PENDING";
  let decisionReason = "insufficient multi-day trend buckets";
  if (trend.length >= MIN_DAY_BUCKETS) {
    const prev = trend[trend.length - 2];
    const latest = trend[trend.length - 1];
    const lowNoveltyImproved = latest.lowNoveltyRatio <= prev.lowNoveltyRatio;
    const blogReviewImproved = latest.blogReviewRequiredRatio <= prev.blogReviewRequiredRatio;
    status = lowNoveltyImproved && blogReviewImproved ? "PASS" : "PENDING";
    decisionReason = lowNoveltyImproved && blogReviewImproved
      ? "latest daily trend improved for low_novelty and blog review_required ratio"
      : "latest daily trend does not show simultaneous improvement";
  }

  console.log(
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        lookbackDays: LOOKBACK_DAYS,
        minDayBuckets: MIN_DAY_BUCKETS,
        status,
        decisionReason,
        trend,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("[content-ops-gate51-trend-check] failed:", error);
  process.exit(1);
});
