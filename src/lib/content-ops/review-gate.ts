export const MIN_REVIEW_BODY_CHARS = 320;

export type ReviewGateInput = {
  bodyMarkdown: string;
  sourceLinkCount: number;
};

export type ReviewGateReason =
  | "source_links_missing"
  | "body_too_short"
  | "possible_overcopy_detected";

export type ReviewGateResult = {
  passed: boolean;
  reasons: ReviewGateReason[];
  metrics: {
    bodyChars: number;
    sourceLinkCount: number;
    longLineCount: number;
    codeFenceLargeBlockDetected: boolean;
    linkOnlyPatternDetected: boolean;
  };
};

function toPlainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*]\([^)]+\)/g, " ")
    .replace(/\[[^\]]*]\([^)]+\)/g, " ")
    .replace(/[#>*_\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countLongLines(markdown: string): number {
  return markdown
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length >= 180).length;
}

function hasLargeCodeFenceBlock(markdown: string): boolean {
  return /```[\s\S]{1200,}?```/m.test(markdown);
}

function detectLinkOnlyPattern(markdown: string, sourceLinkCount: number): boolean {
  const linkCount = (markdown.match(/\[[^\]]+]\([^)]+\)/g) ?? []).length;
  const plainTextChars = toPlainText(markdown).length;
  return sourceLinkCount > 0 && linkCount >= sourceLinkCount && plainTextChars < 200;
}

export function evaluateReviewGate(input: ReviewGateInput): ReviewGateResult {
  const reasons: ReviewGateReason[] = [];
  const bodyChars = toPlainText(input.bodyMarkdown).length;
  const longLineCount = countLongLines(input.bodyMarkdown);
  const codeFenceLargeBlockDetected = hasLargeCodeFenceBlock(input.bodyMarkdown);
  const linkOnlyPatternDetected = detectLinkOnlyPattern(
    input.bodyMarkdown,
    input.sourceLinkCount,
  );

  if (input.sourceLinkCount < 1) {
    reasons.push("source_links_missing");
  }
  if (bodyChars < MIN_REVIEW_BODY_CHARS) {
    reasons.push("body_too_short");
  }
  if (codeFenceLargeBlockDetected || longLineCount >= 4 || linkOnlyPatternDetected) {
    reasons.push("possible_overcopy_detected");
  }

  return {
    passed: reasons.length === 0,
    reasons,
    metrics: {
      bodyChars,
      sourceLinkCount: input.sourceLinkCount,
      longLineCount,
      codeFenceLargeBlockDetected,
      linkOnlyPatternDetected,
    },
  };
}
