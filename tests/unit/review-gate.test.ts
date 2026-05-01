import { describe, expect, it } from "vitest";
import {
  evaluateReviewGate,
  MIN_REVIEW_BODY_CHARS,
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
## Summary
${"This draft summarizes trends and adds operator-focused interpretation. ".repeat(10)}

## Source
- [Example source](https://example.com/article)
      `.trim(),
      sourceLinkCount: 1,
    });
    expect(result.passed).toBe(true);
    expect(result.reasons).toEqual([]);
  });
});
