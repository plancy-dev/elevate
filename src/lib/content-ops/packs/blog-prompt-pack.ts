import type { TopicStrategyEntry } from "@/lib/content-ops/packs/topic-strategy-pack";

export const BLOG_PROMPT_PACK_VERSION = "v1.2.0";

export function buildBlogDraftFromPack(params: {
  topic: TopicStrategyEntry;
  sourceBullets: string[];
}): { title: string; summary: string; bodyMarkdown: string } {
  const title = `${params.topic.titlePattern}: from signal to operating advantage`;
  const summary =
    "Practical long-form breakdown for operators who need reliable AI execution, not hype.";

  const sourceSection =
    params.sourceBullets.length > 0
      ? params.sourceBullets.join("\n")
      : "- No source items were ingested in this cycle.";

  const bodyMarkdown = [
    "## Context",
    params.topic.whyNowPattern,
    "",
    "## Core question",
    params.topic.questionPattern,
    "",
    "## Compare two paths (vs)",
    params.topic.comparisonPattern,
    "",
    "## Contrarian view",
    params.topic.contrarianPattern,
    "- Why this contrarian view changes decision quality for operators.",
    "",
    "## Evidence ladder",
    params.topic.evidencePattern,
    "- Evidence A: runtime/ops signal from recent execution.",
    "- Evidence B: external source or field report that validates the direction.",
    "- Add one caveat where this pattern may not hold.",
    "",
    "## What the latest signals suggest",
    sourceSection,
    "",
    "## Decision framework for teams",
    "### 1) Reliability before scale",
    "- If a workflow lacks clear rollback, do not increase automation frequency.",
    "- Make failure classes visible before optimization.",
    "",
    "### 2) Cost guardrails with ownership",
    "- Pair cost limits with named owners and escalation windows.",
    "- Review retry policy together with business priority, not in isolation.",
    "",
    "### 3) Editorial and ops loop",
    "- Separate generation from approval for trust-critical channels.",
    "- Keep templates versioned so quality can improve without rewiring the pipeline.",
    `- Weekly operator outcome to validate: ${params.topic.operatorOutcomePattern}`,
    "",
    "## Customer relevance checkpoint",
    "- Which target customer profile feels this pain first?",
    "- What outcome would make that reader forward this article to their team lead?",
    "",
    "## Execution checklist (this week)",
    "1. Pick one pipeline stage to harden and define SLO.",
    "2. Run a side-by-side comparison vs the current baseline process.",
    "3. Add one observable metric for quality and one for reliability.",
    "4. Capture one reusable lesson in the runbook.",
    "5. Document one concrete decision made from this week's evidence.",
    "",
    "## Sources",
    sourceSection,
  ].join("\n");

  return { title, summary, bodyMarkdown };
}
