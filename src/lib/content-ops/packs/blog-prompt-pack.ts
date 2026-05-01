import type { TopicStrategyEntry } from "@/lib/content-ops/packs/topic-strategy-pack";

export const BLOG_PROMPT_PACK_VERSION = "v1.1.0";

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
    "",
    "## Execution checklist (this week)",
    "1. Pick one pipeline stage to harden and define SLO.",
    "2. Run a side-by-side comparison vs the current baseline process.",
    "3. Add one observable metric for quality and one for reliability.",
    "4. Capture one reusable lesson in the runbook.",
    "",
    "## Sources",
    sourceSection,
  ].join("\n");

  return { title, summary, bodyMarkdown };
}
