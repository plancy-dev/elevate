import type { TopicStrategyEntry } from "@/lib/content-ops/packs/topic-strategy-pack";
import type { AutotuneStrategy } from "@/lib/content-ops/packs/pack-registry";

export const BLOG_PROMPT_PACK_VERSION = "v1.5.0";

type ParsedSourceBullet = { title: string; url: string };

function parseSourceBullet(raw: string): ParsedSourceBullet | null {
  const match = raw.match(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/);
  if (!match) return null;
  return { title: match[1].trim(), url: match[2].trim() };
}

function strategyGuide(strategy: AutotuneStrategy): string[] {
  if (strategy === "novelty_boost") {
    return [
      "- Surface one non-obvious risk or opportunity most teams miss this week.",
      "- Emphasize differentiated framing over generic recap.",
    ];
  }
  if (strategy === "overcopy_mitigate") {
    return [
      "- Reframe source material into original synthesis with explicit operator implications.",
      "- Avoid long quote-like passages and add your own decision rationale.",
    ];
  }
  return [
    "- Balance originality with operational clarity and reproducibility.",
    "- Keep claims evidence-backed with explicit caveats.",
  ];
}

function noveltyRecoveryChecklist(strategy: AutotuneStrategy): string[] {
  if (strategy === "novelty_boost") {
    return [
      "1. Add one argument that challenges a common operator playbook assumption.",
      "2. Add one explicit `if we keep current path, then ...` downside projection.",
      "3. Propose one experiment with a measurable 7-day impact signal.",
    ];
  }
  if (strategy === "overcopy_mitigate") {
    return [
      "1. Convert each source-derived claim into an original operator implication.",
      "2. Avoid quote-like phrasing and use `decision -> impact -> metric` format.",
      "3. Add one explicit no-go context to prevent over-generalization.",
    ];
  }
  return [
    "1. Pair one fresh angle with one reliability-first caveat.",
    "2. Include at least one `current vs proposed` decision frame.",
    "3. End with owner and review cadence for the proposed change.",
  ];
}

export function buildBlogDraftFromPack(params: {
  topic: TopicStrategyEntry;
  sourceBullets: string[];
  autotuneStrategy: AutotuneStrategy;
}): { title: string; summary: string; bodyMarkdown: string } {
  const title = `${params.topic.titlePattern}: from signal to operating advantage`;
  const summary =
    "Practical long-form breakdown for operators who need reliable AI execution, not hype.";

  const parsedBullets = params.sourceBullets
    .map((bullet) => parseSourceBullet(bullet))
    .filter((bullet): bullet is ParsedSourceBullet => Boolean(bullet));
  const sourceSignalSection =
    parsedBullets.length > 0
      ? parsedBullets.map((bullet, index) => `${index + 1}. ${bullet.title}`).join("\n")
      : "- No source items were ingested in this cycle.";
  const citationAnchorSection =
    parsedBullets.length > 0
      ? parsedBullets
          .slice(0, 3)
          .map((bullet) => `- [${bullet.title}](${bullet.url})`)
          .join("\n")
      : "- Citation anchors unavailable for this cycle.";
  const sourceSection =
    parsedBullets.length > 0
      ? parsedBullets.map((bullet) => `- [${bullet.title}](${bullet.url})`).join("\n")
      : "- No source items were ingested in this cycle.";

  const bodyMarkdown = [
    "## Why now context",
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
    "- Name one decision that should be reversed if this contrarian view is true.",
    "",
    "## Autotune strategy",
    `- Active strategy: ${params.autotuneStrategy}`,
    ...strategyGuide(params.autotuneStrategy),
    "",
    "## Novelty recovery checklist (must pass)",
    ...noveltyRecoveryChecklist(params.autotuneStrategy),
    "",
    "## Anti-repetition guard",
    "- Avoid recycled framing from previous cycle summaries.",
    "- At least one paragraph must compare `current vs proposed` with trade-off cost.",
    "- If guidance sounds generic, add one concrete operator-role context.",
    "",
    "## Evidence ladder",
    params.topic.evidencePattern,
    "- Evidence A: runtime/ops signal from recent execution.",
    "- Evidence B: external source or field report that validates the direction.",
    "- Add one caveat where this pattern may not hold.",
    "",
    "## Citation anchors used in this brief",
    citationAnchorSection,
    "",
    "## What the latest signals suggest",
    sourceSignalSection,
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
