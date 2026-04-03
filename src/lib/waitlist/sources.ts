/** POST body target — keep in sync with `src/app/api/waitlist/route.ts`. */
export const WAITLIST_API_PATH = "/api/waitlist" as const;

/**
 * Values stored in `waitlist_signups.source` (see `013_waitlist_signups.sql`).
 * Keep in sync with POST /api/waitlist validation and `WaitlistForm` props.
 */
export const WAITLIST_SOURCE_VALUES = [
  "home",
  "band",
  /** Future: sticky/footer newsletter CTA */
  "footer",
  /** Blog sidebar or post-end CTA */
  "blog",
  /** E-book or lead-magnet landing */
  "ebook",
] as const;

export type WaitlistSource = (typeof WAITLIST_SOURCE_VALUES)[number];

const SOURCE_SET = new Set<string>(WAITLIST_SOURCE_VALUES);

export function normalizeWaitlistSource(raw: unknown): WaitlistSource {
  if (typeof raw !== "string") return "home";
  const s = raw.trim();
  if (SOURCE_SET.has(s)) return s as WaitlistSource;
  return "home";
}
