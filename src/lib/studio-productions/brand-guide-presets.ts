/**
 * Short English snippets appended to the brand guide textarea (LLM-facing).
 * Labels are localized in `Dashboard.productions.*`.
 */
export const BRAND_GUIDE_PRESET_IDS = [
  "educational",
  "conversational",
  "bold",
  "calm",
  "humorous",
] as const;

export type BrandGuidePresetId = (typeof BRAND_GUIDE_PRESET_IDS)[number];

export const BRAND_GUIDE_PRESET_SNIPPETS: Record<BrandGuidePresetId, string> = {
  educational:
    "Tone: clear and instructive. Explain concepts step by step; define jargon when it appears. Prefer examples over abstract claims.",
  conversational:
    "Tone: friendly and direct, like talking to a peer. Short sentences, plain language, one idea per line where possible.",
  bold:
    "Tone: confident and punchy. Open with a strong hook; decisive statements; avoid hedging unless accuracy requires it.",
  calm:
    "Tone: reassuring and measured. Spacious pacing, minimal hype, steady rhythm.",
  humorous:
    "Tone: light wit when it fits the topic; never mean-spirited. Keep jokes brief so the message stays on track.",
};
