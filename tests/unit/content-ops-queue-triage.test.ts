import { describe, expect, it } from "vitest";
import {
  resolveAutoApprovalPolicy,
  resolveQueueTriageAssessment,
} from "@/lib/content-ops/pipeline-runner";

describe("resolveQueueTriageAssessment", () => {
  it("returns hold_manual when review gate is missing", () => {
    const result = resolveQueueTriageAssessment({ reviewGate: null });
    expect(result.decision).toBe("hold_manual");
    expect(result.reasons).toContain("review_gate_missing");
  });

  it("returns hold_manual when hard-block reason exists", () => {
    const result = resolveQueueTriageAssessment({
      reviewGate: {
        passed: false,
        reasons: ["possible_overcopy_detected", "citation_coverage_low"],
        qualityScore: 12,
      },
    });
    expect(result.decision).toBe("hold_manual");
    expect(result.suggestedAction).toBe("recommend_manual_review");
  });

  it("returns needs_rewrite for fixable review reasons", () => {
    const result = resolveQueueTriageAssessment({
      reviewGate: {
        passed: false,
        reasons: ["citation_coverage_low", "low_novelty"],
        qualityScore: 14,
      },
    });
    expect(result.decision).toBe("needs_rewrite");
    expect(result.suggestedAction).toBe("recommend_rewrite");
  });

  it("returns auto_approve_candidate for strong passed items", () => {
    const result = resolveQueueTriageAssessment({
      reviewGate: {
        passed: true,
        reasons: [],
        qualityScore: 18,
      },
    });
    expect(result.decision).toBe("auto_approve_candidate");
    expect(result.suggestedAction).toBe("recommend_approve");
  });

  it("auto-approval policy passes for safe high-confidence candidate", () => {
    const assessment = resolveQueueTriageAssessment({
      reviewGate: {
        passed: true,
        reasons: [],
        qualityScore: 18,
      },
    });
    const policy = resolveAutoApprovalPolicy({
      assessment,
      reviewGate: { passed: true, reasons: [], qualityScore: 18 },
    });
    expect(policy.allowed).toBe(true);
    expect(policy.nextStatus === "approved" || policy.nextStatus === "scheduled").toBe(true);
  });

  it("auto-approval policy denies candidate with hard-block reason", () => {
    const assessment = {
      decision: "auto_approve_candidate" as const,
      confidence: 0.86,
      reasons: ["review_gate_passed"],
      suggestedAction: "recommend_approve" as const,
    };
    const policy = resolveAutoApprovalPolicy({
      assessment,
      reviewGate: {
        passed: true,
        reasons: ["comparison_missing"],
        qualityScore: 18,
      },
    });
    expect(policy.allowed).toBe(false);
    expect(policy.reason).toBe("hard_block_reason_detected");
    expect(policy.nextStatus).toBe("review_required");
  });
});
