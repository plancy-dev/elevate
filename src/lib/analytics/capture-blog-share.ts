import type { PostHog } from "posthog-js";
import { PostHogEvent } from "@/lib/analytics/posthog-events";
import type { BlogShareChannelId } from "@/lib/blog/share-channel";

export function captureBlogShareChannel(
  posthog: PostHog | null,
  args: { slug: string; locale: string; channel: BlogShareChannelId },
): void {
  posthog?.capture(PostHogEvent.ELEVATE_BLOG_POST_SHARE_CHANNEL, args);
}
