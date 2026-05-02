import {
  BLOG_PROMPT_PACK_VERSION,
  buildBlogDraftFromPack,
} from "@/lib/content-ops/packs/blog-prompt-pack";
import {
  NEWSLETTER_PROMPT_PACK_VERSION,
  buildNewsletterDraftFromPack,
} from "@/lib/content-ops/packs/newsletter-prompt-pack";
import {
  TOPIC_STRATEGY_PACK_VERSION,
  resolveTopicStrategyByWeekday,
} from "@/lib/content-ops/packs/topic-strategy-pack";

export type AutotuneStrategy = "novelty_boost" | "overcopy_mitigate" | "balanced";

export const ACTIVE_CONTENT_PACK_VERSION = "v1.3.0";

function resolveAutotuneStrategy(date: Date): AutotuneStrategy {
  const weekday = date.getUTCDay();
  if (weekday === 1 || weekday === 3) return "novelty_boost";
  if (weekday === 2 || weekday === 5) return "overcopy_mitigate";
  return "balanced";
}

export function resolveActiveContentPacks(date = new Date()) {
  const topic = resolveTopicStrategyByWeekday(date);
  const autotuneStrategy = resolveAutotuneStrategy(date);
  return {
    activeVersion: ACTIVE_CONTENT_PACK_VERSION,
    versions: {
      topicStrategy: TOPIC_STRATEGY_PACK_VERSION,
      newsletterPrompt: NEWSLETTER_PROMPT_PACK_VERSION,
      blogPrompt: BLOG_PROMPT_PACK_VERSION,
    },
    topic,
    autotune: {
      strategy: autotuneStrategy,
      selection: "weekday_contract_v1",
    },
  };
}

export function buildDraftsFromActivePacks(params: {
  sourceBullets: string[];
  date?: Date;
}) {
  const resolved = resolveActiveContentPacks(params.date ?? new Date());
  const newsletter = buildNewsletterDraftFromPack({
    topic: resolved.topic,
    sourceBullets: params.sourceBullets,
    autotuneStrategy: resolved.autotune.strategy,
  });
  const blog = buildBlogDraftFromPack({
    topic: resolved.topic,
    sourceBullets: params.sourceBullets,
    autotuneStrategy: resolved.autotune.strategy,
  });
  return { resolved, newsletter, blog };
}
