import { describe, expect, it } from "vitest";
import { shouldAttemptContentQueueRewrite } from "@/lib/content-ops/pipeline-runner";

describe("shouldAttemptContentQueueRewrite", () => {
  it("allows needs_rewrite even when gate snapshot is missing", () => {
    const { attempt, reviewGate } = shouldAttemptContentQueueRewrite({
      ai_review: { latest: { decision: "needs_rewrite" } },
    });
    expect(attempt).toBe(true);
    expect(reviewGate).toBeNull();
  });

  it("allows hold_manual when gate failed without blockers", () => {
    const { attempt } = shouldAttemptContentQueueRewrite({
      ai_review: { latest: { decision: "hold_manual" } },
      review_gate: {
        latest: {
          passed: false,
          reasons: ["comparison_missing", "citation_coverage_low"],
          metrics: { qualityScore: 14 },
        },
      },
    });
    expect(attempt).toBe(true);
  });

  it("blocks hold_manual when possible_overcopy_detected", () => {
    const { attempt } = shouldAttemptContentQueueRewrite({
      ai_review: { latest: { decision: "hold_manual" } },
      review_gate: {
        latest: {
          passed: false,
          reasons: ["possible_overcopy_detected", "comparison_missing"],
          metrics: { qualityScore: 10 },
        },
      },
    });
    expect(attempt).toBe(false);
  });

  it("blocks auto_approve_candidate", () => {
    const { attempt } = shouldAttemptContentQueueRewrite({
      ai_review: { latest: { decision: "auto_approve_candidate" } },
      review_gate: {
        latest: {
          passed: false,
          reasons: ["citation_coverage_low"],
          metrics: { qualityScore: 18 },
        },
      },
    });
    expect(attempt).toBe(false);
  });

  it("blocks when review gate passed", () => {
    const { attempt } = shouldAttemptContentQueueRewrite({
      ai_review: { latest: { decision: "hold_manual" } },
      review_gate: {
        latest: {
          passed: true,
          reasons: [],
          metrics: { qualityScore: 20 },
        },
      },
    });
    expect(attempt).toBe(false);
  });
});
