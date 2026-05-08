import type { Json } from "@/types/database.types";

export function readLatestReviewGate(metadata: Json | null): {
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

/** `ContentQueueClaudeForms` `gatePassed` prop — PLAN-content-queue-claude-gate-ux §1 (no snapshot → null = primary). */
export function gatePassedPropForClaudeForms(metadata: Json | null): boolean | null {
  const g = readLatestReviewGate(metadata);
  if (!g) return null;
  return g.passed;
}

export function readLatestAiReview(metadata: Json | null): {
  decision: "auto_approve_candidate" | "needs_rewrite" | "hold_manual";
  confidence: number;
  policyReason: string | null;
} | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const aiReview = (metadata as Record<string, unknown>).ai_review;
  if (!aiReview || typeof aiReview !== "object" || Array.isArray(aiReview)) return null;
  const latest = (aiReview as Record<string, unknown>).latest;
  if (!latest || typeof latest !== "object" || Array.isArray(latest)) return null;
  const decision = (latest as Record<string, unknown>).decision;
  if (
    decision !== "auto_approve_candidate" &&
    decision !== "needs_rewrite" &&
    decision !== "hold_manual"
  ) {
    return null;
  }
  const confidenceRaw = Number((latest as Record<string, unknown>).confidence ?? 0);
  const policyReasonRaw = (latest as Record<string, unknown>).policy_reason;
  return {
    decision,
    confidence: Number.isFinite(confidenceRaw) ? confidenceRaw : 0,
    policyReason: typeof policyReasonRaw === "string" ? policyReasonRaw : null,
  };
}

export function readLatestAiRewrite(metadata: Json | null): {
  decisionAfter: "ready_for_approval" | "needs_manual_review";
} | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const aiRewrite = (metadata as Record<string, unknown>).ai_rewrite;
  if (!aiRewrite || typeof aiRewrite !== "object" || Array.isArray(aiRewrite)) return null;
  const latest = (aiRewrite as Record<string, unknown>).latest;
  if (!latest || typeof latest !== "object" || Array.isArray(latest)) return null;
  const decisionAfter = (latest as Record<string, unknown>).decision_after;
  if (decisionAfter !== "ready_for_approval" && decisionAfter !== "needs_manual_review") {
    return null;
  }
  return { decisionAfter };
}

/** Latest Claude editorial brief markdown from `metadata.claude_review_brief`, if any. */
export function readClaudeReviewBriefMarkdown(metadata: Json | null): string | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const root = metadata as Record<string, unknown>;
  const brief = root.claude_review_brief;
  if (!brief || typeof brief !== "object" || Array.isArray(brief)) return null;
  const latest = (brief as Record<string, unknown>).latest;
  if (!latest || typeof latest !== "object" || Array.isArray(latest)) return null;
  const md = (latest as Record<string, unknown>).brief_markdown;
  return typeof md === "string" && md.trim() ? md : null;
}
