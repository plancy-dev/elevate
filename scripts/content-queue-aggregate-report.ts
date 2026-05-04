/**
 * Admin content queue aggregate — service role only (same data as /admin/content-queue).
 * pnpm run content-ops:queue-aggregate
 */
import dotenv from "dotenv";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database.types";

dotenv.config({ path: ".env.local", quiet: true });

type Row = {
  id: string;
  type: string;
  status: string;
  locale: string;
  title: string;
  created_at: string;
  metadata: Json | null;
  review_notes: string | null;
};

function readLatestReviewGate(metadata: Json | null): {
  passed: boolean;
  reasons: string[];
  qualityScore: number;
} | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const reviewGate = (metadata as Record<string, unknown>).review_gate;
  if (!reviewGate || typeof reviewGate !== "object" || Array.isArray(reviewGate)) return null;
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

function readGateReasons(metadata: Json | null): string[] {
  return readLatestReviewGate(metadata)?.reasons ?? [];
}

function isMustReviewNow(row: Row, nowMs: number): boolean {
  if (row.status !== "review_required") return false;
  const latest = readLatestReviewGate(row.metadata);
  const oldEnough = nowMs - new Date(row.created_at).getTime() >= 24 * 60 * 60 * 1000;
  if (oldEnough) return true;
  if (!latest) return true;
  if (latest.qualityScore < 12) return true;
  if (latest.reasons.some((reason) => reason.startsWith("low_"))) return true;
  return Boolean(row.review_notes?.includes("review_gate:"));
}

function readAiDecision(metadata: Json | null): string | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const aiReview = (metadata as Record<string, unknown>).ai_review;
  if (!aiReview || typeof aiReview !== "object" || Array.isArray(aiReview)) return null;
  const latest = (aiReview as Record<string, unknown>).latest;
  if (!latest || typeof latest !== "object" || Array.isArray(latest)) return null;
  const d = (latest as Record<string, unknown>).decision;
  return typeof d === "string" ? d : null;
}

function bump(map: Record<string, number>, key: string, n = 1) {
  map[key] = (map[key] ?? 0) + n;
}

async function main() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("content_items")
    .select("id, type, status, locale, title, created_at, metadata, review_notes")
    .order("updated_at", { ascending: false })
    .limit(500);

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as Row[];
  const nowMs = Date.now();
  const byStatus: Record<string, number> = {};
  const byGateReason: Record<string, number> = {};
  const byAiDecision: Record<string, number> = {};
  const byTypeStatus: Record<string, number> = {};
  let pendingApproval = 0;
  let staleOver24h = 0;
  let mustReviewNow = 0;
  let slaRiskReviewRequired = 0;

  for (const r of rows) {
    bump(byStatus, r.status);
    bump(byTypeStatus, `${r.type}:${r.status}`);
    const isPending = r.status === "draft" || r.status === "review_required";
    if (isPending) {
      pendingApproval += 1;
      if (nowMs - new Date(r.created_at).getTime() >= 24 * 60 * 60 * 1000) {
        staleOver24h += 1;
      }
    }
    if (r.status === "review_required") {
      const ageHours = Math.floor((nowMs - new Date(r.created_at).getTime()) / (60 * 60 * 1000));
      if (ageHours >= 24) slaRiskReviewRequired += 1;
    }
    if (isMustReviewNow(r, nowMs)) mustReviewNow += 1;

    for (const reason of readGateReasons(r.metadata)) {
      bump(byGateReason, reason);
    }
    const ad = readAiDecision(r.metadata);
    if (ad) bump(byAiDecision, ad);
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    command: "pnpm run content-ops:queue-aggregate",
    rowCountScanned: rows.length,
    summaryCards: { pendingApproval, staleOver24h, mustReviewNow, slaRiskReviewRequired },
    byStatus,
    byTypeStatus,
    byGateReason,
    byAiDecision,
  };

  console.log(JSON.stringify(payload, null, 2));
}

main().catch((e) => {
  console.error("[content-queue-aggregate-report] failed:", e);
  process.exit(1);
});
