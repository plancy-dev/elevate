import { describe, expect, it } from "vitest";
import {
  evaluateReviewGate,
  MIN_REVIEW_BODY_CHARS,
  MIN_REVIEW_QUALITY_SCORE,
} from "@/lib/content-ops/review-gate";

describe("evaluateReviewGate", () => {
  it("fails when source links are missing", () => {
    const result = evaluateReviewGate({
      bodyMarkdown: "This is a proper looking draft with enough text ".repeat(12),
      sourceLinkCount: 0,
    });
    expect(result.passed).toBe(false);
    expect(result.reasons).toContain("source_links_missing");
  });

  it("fails when body is too short", () => {
    const result = evaluateReviewGate({
      bodyMarkdown: "short body only",
      sourceLinkCount: 2,
    });
    expect(result.passed).toBe(false);
    expect(result.reasons).toContain("body_too_short");
    expect(result.metrics.bodyChars).toBeLessThan(MIN_REVIEW_BODY_CHARS);
  });

  it("fails on overcopy heuristic for huge code fence", () => {
    const codeBlock = `\`\`\`\n${"x".repeat(1500)}\n\`\`\``;
    const result = evaluateReviewGate({
      bodyMarkdown: `${"Meaningful intro ".repeat(30)}\n\n${codeBlock}`,
      sourceLinkCount: 1,
    });
    expect(result.passed).toBe(false);
    expect(result.reasons).toContain("possible_overcopy_detected");
    expect(result.metrics.codeFenceLargeBlockDetected).toBe(true);
  });

  it("passes for valid content with source and enough narrative", () => {
    const result = evaluateReviewGate({
      bodyMarkdown: `
## Why now
${"This draft summarizes trends and adds operator-focused interpretation for workflow operators. ".repeat(8)}

## Comparison
Teams usually optimize speed first vs reliability. This post highlights the trade-off.

## Action checklist
1. Add one rollback owner.
2. Add one failure-class dashboard.
3. Implement one weekly review ritual.

## Source
- [Example source](https://example.com/article)
      `.trim(),
      sourceLinkCount: 1,
    });
    expect(result.passed).toBe(true);
    expect(result.reasons).toEqual([]);
    expect(result.metrics.qualityScore).toBeGreaterThanOrEqual(MIN_REVIEW_QUALITY_SCORE);
    expect(result.metrics.rubric.actionability).toBeGreaterThan(1);
  });

  it("fails when rubric quality is too low even with links", () => {
    const result = evaluateReviewGate({
      bodyMarkdown: "## Note\n\n- [Source](https://example.com)\n\nThis happened.",
      sourceLinkCount: 1,
    });
    expect(result.passed).toBe(false);
    expect(result.metrics.qualityScore).toBeLessThan(MIN_REVIEW_QUALITY_SCORE);
    expect(result.reasons).toContain("low_specificity");
  });
});
