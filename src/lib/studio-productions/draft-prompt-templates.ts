/**
 * Seeded draft prompt templates (P1): stable keys + English bias text for the LLM user prompt.
 * Display labels live in i18n (`Dashboard.productions.draftTemplateOption*`).
 */
export const DRAFT_TEMPLATE_KEYS = [
  "default",
  "punchy_shorts",
  "story_educational",
  "soft_cta",
] as const;

export type DraftTemplateKey = (typeof DRAFT_TEMPLATE_KEYS)[number];

export const DEFAULT_DRAFT_TEMPLATE_KEY: DraftTemplateKey = "default";

const BIAS: Record<DraftTemplateKey, string> = {
  default:
    "Keep hook and script concise and suitable for the stated channel. Balance clarity with energy; do not force a gimmick unless direction below asks for one.",
  punchy_shorts:
    "Prioritize a punchy hook in the first line, tight pacing, pattern interrupts, and vivid verbs. Favor scroll-stopping curiosity over long explanation.",
  story_educational:
    "Favor a clear mini-arc or lesson-bite structure: hook → setup → insight → takeaway. One main idea; avoid rambling.",
  soft_cta:
    "End with a gentle, non-pushy call to action (follow, comment, save) that matches the channel tone—avoid hard sell or fake urgency.",
};

export function isDraftTemplateKey(value: string): value is DraftTemplateKey {
  return (DRAFT_TEMPLATE_KEYS as readonly string[]).includes(value);
}

/** Unknown or empty values fall back to {@link DEFAULT_DRAFT_TEMPLATE_KEY} (tamper-resistant). */
export function normalizeDraftTemplateKey(raw: string): DraftTemplateKey {
  const t = raw.trim();
  return isDraftTemplateKey(t) ? t : DEFAULT_DRAFT_TEMPLATE_KEY;
}

export function getDraftTemplateBiasText(key: DraftTemplateKey): string {
  return BIAS[key];
}

/** Form value prefix for org-scoped custom templates (`custom:<uuid>`). */
export const CUSTOM_DRAFT_TEMPLATE_PREFIX = "custom:" as const;

export const STUDIO_DRAFT_TEMPLATE_NAME_MAX = 200;
export const STUDIO_DRAFT_TEMPLATE_BIAS_MAX = 12_000;

export function isCustomDraftTemplateFormValue(value: string): boolean {
  return value.trim().startsWith(CUSTOM_DRAFT_TEMPLATE_PREFIX);
}

/** Returns UUID after `custom:` or null if malformed. */
export function parseCustomDraftTemplateId(value: string): string | null {
  const t = value.trim();
  if (!t.startsWith(CUSTOM_DRAFT_TEMPLATE_PREFIX)) return null;
  const id = t.slice(CUSTOM_DRAFT_TEMPLATE_PREFIX.length).trim();
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  ) {
    return null;
  }
  return id.toLowerCase();
}
