import type { TopicStrategyEntry } from "@/lib/content-ops/packs/topic-strategy-pack";

export const NEWSLETTER_PROMPT_PACK_VERSION = "v1.2.0";

export function buildNewsletterDraftFromPack(params: {
  topic: TopicStrategyEntry;
  sourceBullets: string[];
}): { title: string; summary: string; bodyMarkdown: string } {
  const today = new Date().toISOString().slice(0, 10);
  const title = `Daily AI Brief: ${params.topic.titlePattern} (${today})`;
  const summary = `${params.topic.questionPattern} Focused digest for workflow operators.`;

  const sourceSection =
    params.sourceBullets.length > 0
      ? params.sourceBullets.join("\n")
      : "- No source items were ingested in this window.";

  const bodyMarkdown = [
    "## Hook",
    params.topic.questionPattern,
    "",
    "## Why this matters now",
    params.topic.whyNowPattern,
    "",
    "## Trade-off vs default approach",
    params.topic.comparisonPattern,
    "- Compare the short-term win against long-term operational drag.",
    "- Name one trade-off your team is currently underestimating.",
    "",
    "## Counter-signal (what most teams miss)",
    params.topic.contrarianPattern,
    "",
    "## Evidence snapshot",
    params.topic.evidencePattern,
    "- Add one quantitative cue (count, rate, delta, or time window).",
    "- Add one source-backed causal explanation, not just correlation.",
    "",
    "## What changed in the last 24h",
    sourceSection,
    "",
    "## Operator lens",
    "- Identify one workflow where failure cost is non-trivial.",
    "- Add one guardrail that catches high-impact mistakes early.",
    "- Assign one owner for retry and rollback decisions.",
    `- Outcome target: ${params.topic.operatorOutcomePattern}`,
    "",
    "## What this means for target customers",
    "- Explain why this decision matters for teams operating AI in production this week.",
    "- Describe one curiosity hook that would make a reader share this brief internally.",
    "",
    "## This week action checklist",
    "1. Audit one fragile automation path end-to-end.",
    "2. Compare current process vs safer alternative and document trade-offs.",
    "3. Add run-level visibility for failure classes.",
    "4. Define manual override policy before scaling frequency.",
    "5. Record one measurable before/after signal to validate impact.",
    "",
    "## Sources",
    sourceSection,
  ].join("\n");

  return { title, summary, bodyMarkdown };
}
