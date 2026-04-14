/**
 * Product analytics event names (snake_case values for PostHog).
 * Prefer a single callsite per event where possible.
 */
export const PostHogEvent = {
  ELEVATE_APP_READY: "elevate_app_ready",
  ELEVATE_DASHBOARD_IDENTIFIED: "elevate_dashboard_identified",
  /** Funnel stages — see docs/CONTENT_FUNNEL.md */
  ELEVATE_FUNNEL_LIBRARY_VIEW: "elevate_funnel_library_view",
  ELEVATE_FUNNEL_BILLING_VIEW: "elevate_funnel_billing_view",
  ELEVATE_FUNNEL_PURCHASE_COMPLETED: "elevate_funnel_purchase_completed",
  ELEVATE_FUNNEL_ASSET_DOWNLOAD: "elevate_funnel_asset_download",
  ELEVATE_FUNNEL_EBOOK_READER_VIEW: "elevate_funnel_ebook_reader_view",
  ELEVATE_FUNNEL_EBOOK_READER_LINK_CLICK: "elevate_funnel_ebook_reader_link_click",
  /** Blog — share current URL to clipboard (no PII in properties) */
  ELEVATE_BLOG_POST_SHARE_LINK_COPIED: "elevate_blog_post_share_link_copied",
  /** Blog — share action: `channel` = copy | x | facebook | linkedin | threads | email */
  ELEVATE_BLOG_POST_SHARE_CHANNEL: "elevate_blog_post_share_channel",
  /** Blog — one event per post view (`slug`, `locale`, `post_title` — public title only) */
  ELEVATE_BLOG_POST_VIEWED: "elevate_blog_post_viewed",
  /** Marketing / waitlist — no PII in properties */
  ELEVATE_WAITLIST_SUBMITTED: "elevate_waitlist_submitted",
  ELEVATE_WAITLIST_SUBMIT_FAILED: "elevate_waitlist_submit_failed",
  ELEVATE_MARKETING_CTA_CLICK: "elevate_marketing_cta_click",
  /**
   * Prompt Studio → Productions handoff (sessionStorage + navigate).
   * Properties: `target` = new_episode | existing_episode
   */
  ELEVATE_STUDIO_TO_PRODUCTIONS_HANDOFF: "elevate_studio_to_productions_handoff",
  /** Studio episode — LLM hook/title/script drafts (`episode_id` only; no content) */
  ELEVATE_STUDIO_EPISODE_DRAFT_GENERATED: "elevate_studio_episode_draft_generated",
  ELEVATE_STUDIO_EPISODE_DRAFT_REFINED: "elevate_studio_episode_draft_refined",
  ELEVATE_STUDIO_EPISODE_DRAFT_SAVED_MANUAL: "elevate_studio_episode_draft_saved_manual",
  /**
   * Runway text-to-video from episode draft panel.
   * Properties: `episode_id`; `outcome` = started | completed | failed (no PII).
   */
  ELEVATE_STUDIO_EPISODE_RUNWAY_RENDER: "elevate_studio_episode_runway_render",
  ELEVATE_STUDIO_EPISODE_YOUTUBE_UPLOAD_STUB_CLICKED:
    "elevate_studio_episode_youtube_upload_stub_clicked",
} as const;

/** `elevate_marketing_cta_click` — stable `cta_id` values */
export const MarketingCtaId = {
  HERO_EBOOKS: "hero_ebooks",
  HERO_WAITLIST_ANCHOR: "hero_waitlist_anchor",
  HERO_PROMPT_STUDIO: "hero_prompt_studio",
  HERO_SIGNUP: "hero_signup",
  BAND_CONTACT: "band_contact",
} as const;
