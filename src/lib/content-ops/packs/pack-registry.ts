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

export const ACTIVE_CONTENT_PACK_VERSION = "v1.0.0";

export function resolveActiveContentPacks(date = new Date()) {
  const topic = resolveTopicStrategyByWeekday(date);
  return {
    activeVersion: ACTIVE_CONTENT_PACK_VERSION,
    versions: {
      topicStrategy: TOPIC_STRATEGY_PACK_VERSION,
      newsletterPrompt: NEWSLETTER_PROMPT_PACK_VERSION,
      blogPrompt: BLOG_PROMPT_PACK_VERSION,
    },
    topic,
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
  });
  const blog = buildBlogDraftFromPack({
    topic: resolved.topic,
    sourceBullets: params.sourceBullets,
  });
  return { resolved, newsletter, blog };
}
