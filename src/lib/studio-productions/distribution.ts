/** Canonical keys stored in `studio_production_episodes.distribution_label` for presets. */
export const DISTRIBUTION_PRESET_KEYS = [
  "youtube_shorts",
  "youtube_long",
  "instagram_reels",
  "tiktok",
  "linkedin",
  "x_twitter",
  "website_other",
  "other_platform",
] as const;

export type DistributionPresetKey = (typeof DISTRIBUTION_PRESET_KEYS)[number];

export const DISTRIBUTION_CUSTOM = "__custom__";

const PRESET_SET = new Set<string>(DISTRIBUTION_PRESET_KEYS);

export function isDistributionPresetKey(value: string): value is DistributionPresetKey {
  return PRESET_SET.has(value);
}

/** Server: merge preset select + optional custom line into a single DB value. */
export function resolveDistributionLabelFromForm(formData: FormData): string {
  const preset = String(formData.get("distribution_preset") ?? "").trim();
  const custom = String(formData.get("distribution_custom") ?? "").trim();
  if (preset === DISTRIBUTION_CUSTOM) {
    return custom.slice(0, 500);
  }
  if (preset === "") {
    return "";
  }
  if (PRESET_SET.has(preset)) {
    return preset;
  }
  return custom.slice(0, 500);
}

/** True when the stored or form-resolved label is the `youtube_shorts` preset (not free-text custom). */
export function isYoutubeShortsDistributionLabel(label: string): boolean {
  return label.trim() === "youtube_shorts";
}

/** Presets where an optional `studio_distribution_channel_id` may be saved. */
export const DISTRIBUTION_CHANNEL_PRESETS: ReadonlySet<string> = new Set([
  "youtube_shorts",
  "youtube_long",
  "instagram_reels",
  "tiktok",
  "x_twitter",
]);

export function isDistributionChannelPresetLabel(label: string): boolean {
  return DISTRIBUTION_CHANNEL_PRESETS.has(label.trim());
}

export function parseStoredDistribution(stored: string): {
  preset: string;
  custom: string;
} {
  const s = stored.trim();
  if (s === "") {
    return { preset: "", custom: "" };
  }
  if (PRESET_SET.has(s)) {
    return { preset: s, custom: "" };
  }
  return { preset: DISTRIBUTION_CUSTOM, custom: s };
}

/** Maps preset key → i18n key under Dashboard.productions.publishUrlHint* */
export function publishUrlHintMessageKey(preset: string): string {
  switch (preset) {
    case "youtube_shorts":
      return "publishUrlHintYoutubeShorts";
    case "youtube_long":
      return "publishUrlHintYoutubeLong";
    case "instagram_reels":
      return "publishUrlHintInstagram";
    case "tiktok":
      return "publishUrlHintTiktok";
    case "linkedin":
      return "publishUrlHintLinkedin";
    case "x_twitter":
      return "publishUrlHintX";
    case "website_other":
      return "publishUrlHintWebsite";
    case "other_platform":
      return "publishUrlHintOther";
    default:
      return "publishUrlHintGeneric";
  }
}

export function publishUrlPlaceholderKey(preset: string): string {
  switch (preset) {
    case "youtube_shorts":
    case "youtube_long":
      return "publishUrlPlaceholderYoutube";
    case "instagram_reels":
      return "publishUrlPlaceholderInstagram";
    case "tiktok":
      return "publishUrlPlaceholderTiktok";
    case "linkedin":
      return "publishUrlPlaceholderLinkedin";
    case "x_twitter":
      return "publishUrlPlaceholderX";
    case "website_other":
      return "publishUrlPlaceholderWebsite";
    default:
      return "publishUrlPlaceholderGeneric";
  }
}

/** List / badges: show localized preset or raw custom text. */
export function distributionDisplayLabel(
  stored: string,
  t: (key: string) => string,
): string {
  const s = stored.trim();
  if (!s) return "";
  if (isDistributionPresetKey(s)) {
    return t(`channelPreset.${s}`);
  }
  return s;
}

export function publishUrlLabelKey(preset: string): string {
  switch (preset) {
    case "youtube_shorts":
    case "youtube_long":
      return "publishUrlLabelYoutube";
    case "instagram_reels":
      return "publishUrlLabelInstagram";
    case "tiktok":
      return "publishUrlLabelTiktok";
    case "linkedin":
      return "publishUrlLabelLinkedin";
    case "x_twitter":
      return "publishUrlLabelX";
    case "website_other":
      return "publishUrlLabelWebsite";
    case "other_platform":
      return "publishUrlLabelOther";
    default:
      return "publishUrlLabel";
  }
}
