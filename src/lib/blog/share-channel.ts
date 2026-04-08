/**
 * PostHog `elevate_blog_post_share_channel` — stable `channel` values.
 */
export const BlogShareChannel = {
  COPY: "copy",
  X: "x",
  FACEBOOK: "facebook",
  LINKEDIN: "linkedin",
  THREADS: "threads",
  EMAIL: "email",
} as const;

export type BlogShareChannelId =
  (typeof BlogShareChannel)[keyof typeof BlogShareChannel];
