export const MIN_REVIEW_BODY_CHARS = 320;
export const MIN_REVIEW_QUALITY_SCORE = 12;
export const MIN_REVIEW_CITATION_COVERAGE = 0.6;

export type ReviewGateInput = {
  bodyMarkdown: string;
  sourceLinkCount: number;
};

export type ReviewGateReason =
  | "source_links_missing"
  | "body_too_short"
  | "possible_overcopy_detected"
  | "comparison_missing"
  | "counterargument_missing"
  | "evidence_count_insufficient"
  | "citation_coverage_low"
  | "low_relevance"
  | "low_novelty"
  | "low_specificity"
  | "low_evidence"
  | "low_actionability";

export type ReviewGateRubric = {
  relevance: number;
  novelty: number;
  specificity: number;
  evidence: number;
  actionability: number;
};

export type ReviewGateResult = {
  passed: boolean;
  reasons: ReviewGateReason[];
  metrics: {
    bodyChars: number;
    sourceLinkCount: number;
    longLineCount: number;
    codeFenceLargeBlockDetected: boolean;
    linkOnlyPatternDetected: boolean;
    comparisonSignalCount: number;
    counterSignalCount: number;
    evidenceAnchorCount: number;
    citationCoverage: number;
    qualityScore: number;
    rubric: ReviewGateRubric;
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

function countMatches(text: string, regex: RegExp): number {
  return (text.match(regex) ?? []).length;
}

function inspectStructuralGuards(markdown: string, sourceLinkCount: number): {
  comparisonSignalCount: number;
  counterSignalCount: number;
  evidenceAnchorCount: number;
} {
  const normalized = markdown.toLowerCase();
  const comparisonSignalCount = countMatches(
    normalized,
    /\b(vs|versus|trade-off|tradeoff|compare|comparison)\b/g,
  );
  const counterSignalCount = countMatches(
    normalized,
    /\b(contrarian|counter-signal|counter signal|counterargument|counter argument|objection|rebuttal)\b/g,
  );
  const linkCount = countMatches(markdown, /\[[^\]]+]\([^)]+\)/g);
  const evidenceKeywordCount = countMatches(
    normalized,
    /\b(evidence|source|according|report|dataset|benchmark|metric|delta)\b/g,
  );
  const evidenceAnchorCount = Math.max(linkCount, sourceLinkCount) + evidenceKeywordCount;
  return { comparisonSignalCount, counterSignalCount, evidenceAnchorCount };
}

function computeCitationCoverage(markdown: string, sourceLinkCount: number): number {
  const markdownLinkCount = countMatches(markdown, /\[[^\]]+]\([^)]+\)/g);
  const bareUrlCount = countMatches(markdown, /\bhttps?:\/\/[^\s)]+/g);
  const citationAnchorCount = Math.max(markdownLinkCount, bareUrlCount);
  if (sourceLinkCount <= 0) return 0;
  return Number(Math.min(1, citationAnchorCount / sourceLinkCount).toFixed(4));
}

function scoreRubric(markdown: string, sourceLinkCount: number): ReviewGateRubric {
  const normalized = markdown.toLowerCase();
  const plainText = toPlainText(markdown).toLowerCase();
  const headingCount = countMatches(markdown, /^##\s+/gm);
  const listCount = countMatches(markdown, /^\s*[-*]\s+/gm);
  const numberedCount = countMatches(markdown, /^\s*\d+\.\s+/gm);
  const comparisonSignals = countMatches(
    normalized,
    /\b(vs|versus|trade-off|tradeoff|compare|comparison)\b/g,
  );
  const evidenceSignals = countMatches(plainText, /\b(source|according|report|data)\b/g);
  const actionSignals = countMatches(
    plainText,
    /\b(checklist|next step|action|implement|do this|owner)\b/g,
  );

  const relevance = Math.min(
    5,
    1 + (headingCount >= 3 ? 1 : 0) + (plainText.includes("operator") ? 1 : 0) + (actionSignals > 0 ? 2 : 0),
  );
  const novelty = Math.min(5, 1 + (comparisonSignals >= 1 ? 2 : 0) + (plainText.includes("why now") ? 2 : 0));
  const specificity = Math.min(
    5,
    1 + (listCount >= 3 ? 2 : 0) + (numberedCount >= 2 ? 2 : 0),
  );
  const evidence = Math.min(5, 1 + (sourceLinkCount >= 2 ? 2 : sourceLinkCount >= 1 ? 1 : 0) + (evidenceSignals >= 1 ? 2 : 0));
  const actionability = Math.min(
    5,
    1 + (actionSignals >= 2 ? 2 : actionSignals >= 1 ? 1 : 0) + (numberedCount >= 2 ? 2 : 0),
  );

  return { relevance, novelty, specificity, evidence, actionability };
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
  const structural = inspectStructuralGuards(input.bodyMarkdown, input.sourceLinkCount);
  const citationCoverage = computeCitationCoverage(
    input.bodyMarkdown,
    input.sourceLinkCount,
  );
  const rubric = scoreRubric(input.bodyMarkdown, input.sourceLinkCount);
  const qualityScore =
    rubric.relevance +
    rubric.novelty +
    rubric.specificity +
    rubric.evidence +
    rubric.actionability;

  if (input.sourceLinkCount < 1) {
    reasons.push("source_links_missing");
  }
  if (bodyChars < MIN_REVIEW_BODY_CHARS) {
    reasons.push("body_too_short");
  }
  if (codeFenceLargeBlockDetected || longLineCount >= 4 || linkOnlyPatternDetected) {
    reasons.push("possible_overcopy_detected");
  }
  if (structural.comparisonSignalCount < 1) {
    reasons.push("comparison_missing");
  }
  if (structural.counterSignalCount < 1) {
    reasons.push("counterargument_missing");
  }
  if (structural.evidenceAnchorCount < 2) {
    reasons.push("evidence_count_insufficient");
  }
  if (
    input.sourceLinkCount > 0 &&
    citationCoverage < MIN_REVIEW_CITATION_COVERAGE
  ) {
    reasons.push("citation_coverage_low");
  }
  if (rubric.relevance < 2) reasons.push("low_relevance");
  if (rubric.novelty < 2) reasons.push("low_novelty");
  if (rubric.specificity < 2) reasons.push("low_specificity");
  if (rubric.evidence < 2) reasons.push("low_evidence");
  if (rubric.actionability < 2) reasons.push("low_actionability");
  if (qualityScore < MIN_REVIEW_QUALITY_SCORE) {
    if (!reasons.includes("low_specificity")) reasons.push("low_specificity");
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
      comparisonSignalCount: structural.comparisonSignalCount,
      counterSignalCount: structural.counterSignalCount,
      evidenceAnchorCount: structural.evidenceAnchorCount,
      citationCoverage,
      qualityScore,
      rubric,
    },
  };
}
