import type { TopicStrategyEntry } from "@/lib/content-ops/packs/topic-strategy-pack";
import type { AutotuneStrategy } from "@/lib/content-ops/packs/pack-registry";

export const NEWSLETTER_PROMPT_PACK_VERSION = "v1.6.0";

type ParsedSourceBullet = { title: string; url: string };

function parseSourceBullet(raw: string): ParsedSourceBullet | null {
  const match = raw.match(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/);
  if (!match) return null;
  return { title: match[1].trim(), url: match[2].trim() };
}

function strategyGuide(strategy: AutotuneStrategy): string[] {
  if (strategy === "novelty_boost") {
    return [
      "- Prioritize new signal combinations and avoid repeating last cycle's framing.",
      "- Add one counter-intuitive implication backed by source evidence.",
    ];
  }
  if (strategy === "overcopy_mitigate") {
    return [
      "- Rewrite source-derived claims into original operator guidance language.",
      "- Keep direct source phrasing minimal and explicitly add interpretation.",
    ];
  }
  return [
    "- Keep novelty and reliability balanced with one concrete outcome target.",
    "- Prefer concise evidence-backed claims over broad speculation.",
  ];
}

function noveltyRecoveryChecklist(strategy: AutotuneStrategy): string[] {
  if (strategy === "novelty_boost") {
    return [
      "1. Write one concrete `instead of X, do Y` statement tied to an operator workflow.",
      "2. Include one explicit disagreement with common best practice and justify it with sources.",
      "3. Add one measurable 24h outcome the team can verify in `/admin/content-quality`.",
    ];
  }
  if (strategy === "overcopy_mitigate") {
    return [
      "1. Rewrite every source claim into original operator language before giving guidance.",
      "2. Add one comparison table-style sentence (`current vs proposed`) using your own wording.",
      "3. Add one caveat where the recommendation should NOT be applied.",
    ];
  }
  return [
    "1. Keep one novel angle and one reliability guardrail in the same brief.",
    "2. Make at least one comparison sentence with explicit trade-off cost.",
    "3. End with one owner-assigned action and one measurable check-in signal.",
  ];
}

export function buildNewsletterDraftFromPack(params: {
  topic: TopicStrategyEntry;
  sourceBullets: string[];
  autotuneStrategy: AutotuneStrategy;
}): { title: string; summary: string; bodyMarkdown: string } {
  const today = new Date().toISOString().slice(0, 10);
  const title = `Daily AI Brief: ${params.topic.titlePattern} (${today})`;
  const summary = `${params.topic.questionPattern} Focused digest for workflow operators.`;

  const parsedBullets = params.sourceBullets
    .map((bullet) => parseSourceBullet(bullet))
    .filter((bullet): bullet is ParsedSourceBullet => Boolean(bullet));
  const sourceSignalSection =
    parsedBullets.length > 0
      ? parsedBullets.map((bullet, index) => `${index + 1}. ${bullet.title}`).join("\n")
      : "- No source items were ingested in this window.";
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
      : "- No source items were ingested in this window.";

  const bodyMarkdown = [
    "## Hook",
    params.topic.questionPattern,
    "",
    "## Why now (why this matters now)",
    params.topic.whyNowPattern,
    "",
    "## Trade-off vs default approach",
    params.topic.comparisonPattern,
    "- Compare the short-term win against long-term operational drag.",
    "- Name one trade-off your team is currently underestimating.",
    "",
    "## Counter-signal (what most teams miss)",
    params.topic.contrarianPattern,
    "- Start with: `Most teams assume ... but the hidden cost is ...`.",
    "- Tie this counter-signal to one decision that changes this week.",
    "",
    "## Evidence snapshot",
    params.topic.evidencePattern,
    "- Add one quantitative cue (count, rate, delta, or time window).",
    "- Add one source-backed causal explanation, not just correlation.",
    "",
    "## Citation anchors used in this brief",
    citationAnchorSection,
    "",
    "## Autotune strategy",
    `- Active strategy: ${params.autotuneStrategy}`,
    ...strategyGuide(params.autotuneStrategy),
    "",
    "## Novelty recovery checklist (must pass)",
    ...noveltyRecoveryChecklist(params.autotuneStrategy),
    "",
    "## Unverified claims guard",
    "- Every specific fact, date, statistic, or quote must trace to a citation anchor, an ingested source bullet, or explicit operator/runtime evidence in this cycle.",
    "- If no source supports a tempting factual claim, either remove it, reframe as opinion/hypothesis, or add a visible caveat (e.g. \"unverified in this digest\").",
    "- Do not present forum anecdotes, viral tips, or community hearsay as verified industry outcomes.",
    "",
    "## Anti-repetition guard",
    "- Do not repeat yesterday's same framing or headline pattern.",
    "- If a claim sounds generic, rewrite it with one concrete operator context.",
    "- Keep at least one sentence in `current vs proposed` format.",
    "",
    "## What changed in the last 24h",
    sourceSignalSection,
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
