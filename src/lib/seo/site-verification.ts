/**
 * Naver Search Advisor — `<meta name="naver-site-verification" content="…" />`
 * Override with `NEXT_PUBLIC_NAVER_SITE_VERIFICATION` without code edits if Naver re-issues a token.
 */
export const NAVER_SITE_VERIFICATION_CONTENT =
  process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION?.trim() ??
  "1b53b553a6c013bb5181aa2406a8caab57ea89df";

/**
 * Google Search Console — optional HTML tag verification (`meta name="google-site-verification"`).
 * Set `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` to the **content** value from GSC (not the full tag).
 */
export const GOOGLE_SITE_VERIFICATION_CONTENT =
  process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim() ?? "";
