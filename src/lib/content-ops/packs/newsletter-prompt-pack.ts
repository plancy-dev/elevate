import type { TopicStrategyEntry } from "@/lib/content-ops/packs/topic-strategy-pack";

export const NEWSLETTER_PROMPT_PACK_VERSION = "v1.0.0";

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
    "## What changed in the last 24h",
    sourceSection,
    "",
    "## Operator lens",
    "- Identify one workflow where failure cost is non-trivial.",
    "- Add one guardrail that catches high-impact mistakes early.",
    "- Assign one owner for retry and rollback decisions.",
    "",
    "## This week action checklist",
    "1. Audit one fragile automation path end-to-end.",
    "2. Add run-level visibility for failure classes.",
    "3. Define manual override policy before scaling frequency.",
    "",
    "## Sources",
    sourceSection,
  ].join("\n");

  return { title, summary, bodyMarkdown };
}
