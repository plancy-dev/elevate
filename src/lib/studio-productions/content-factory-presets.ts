/**
 * T4: Content factory presets — end-to-end pipeline configurations.
 * Each preset bundles: reference adaptation mode, draft template, video preset,
 * and pipeline parameters into a single reusable configuration.
 */

import type { ScriptAdaptationMode } from "./reference-source";

export type ContentFactoryPreset = {
  id: string;
  name: string;
  nameI18nKey: string;
  description: string;
  descriptionI18nKey: string;
  adaptationMode: ScriptAdaptationMode;
  targetLanguage: string;
  draftTemplateKey: string;
  videoPresetId: string;
  defaultInstructions: string;
  ttsVoiceHint?: string;
  tags: string[];
};

export const CONTENT_FACTORY_PRESETS: ContentFactoryPreset[] = [
  {
    id: "lecture_translate_shorts",
    name: "Lecture Translation (Shorts)",
    nameI18nKey: "presetLectureTranslateShorts",
    description:
      "Translate an English lecture/speech into Korean Shorts with AI animation.",
    descriptionI18nKey: "presetLectureTranslateShortsDesc",
    adaptationMode: "translate",
    targetLanguage: "Korean",
    draftTemplateKey: "punchy_shorts",
    videoPresetId: "shorts_clean",
    defaultInstructions:
      "Focus on the most impactful 60-second segment. Adapt for Korean YouTube audience. Use vivid scene descriptions for animation.",
    tags: ["education", "translation", "shorts"],
  },
  {
    id: "book_review_shorts",
    name: "Book Review (Shorts)",
    nameI18nKey: "presetBookReviewShorts",
    description:
      "Turn a book summary into a 40-60 second review with book recommendation CTA.",
    descriptionI18nKey: "presetBookReviewShortsDesc",
    adaptationMode: "book_review_short",
    targetLanguage: "Korean",
    draftTemplateKey: "punchy_shorts",
    videoPresetId: "shorts_bold",
    defaultInstructions:
      "Hook with the most surprising insight. End with a clear book recommendation. Include visual cues for animation.",
    tags: ["books", "review", "shorts"],
  },
  {
    id: "book_review_longform",
    name: "Book Review (Long-form)",
    nameI18nKey: "presetBookReviewLong",
    description:
      "Deep-dive book analysis with structured insights and recommendation.",
    descriptionI18nKey: "presetBookReviewLongDesc",
    adaptationMode: "book_review_long",
    targetLanguage: "Korean",
    draftTemplateKey: "story_educational",
    videoPresetId: "longform_standard",
    defaultInstructions:
      "Structure: hook → 3-5 key insights → personal reflection → recommendation. Each section should be visually distinct for animation.",
    tags: ["books", "review", "longform"],
  },
  {
    id: "news_summary_shorts",
    name: "News Summary (Shorts)",
    nameI18nKey: "presetNewsSummaryShorts",
    description: "Summarize news/articles into punchy 60-second animated Shorts.",
    descriptionI18nKey: "presetNewsSummaryShortsDesc",
    adaptationMode: "news_summary",
    targetLanguage: "Korean",
    draftTemplateKey: "punchy_shorts",
    videoPresetId: "shorts_clean",
    defaultInstructions:
      "Lead with the most important finding. Use authoritative tone. End with implications.",
    tags: ["news", "summary", "shorts"],
  },
  {
    id: "storytelling_animation",
    name: "Storytelling Animation",
    nameI18nKey: "presetStoryAnimation",
    description:
      "Transform any source into an entertaining story-driven animated narrative.",
    descriptionI18nKey: "presetStoryAnimationDesc",
    adaptationMode: "storytelling_animation",
    targetLanguage: "Korean",
    draftTemplateKey: "story_educational",
    videoPresetId: "shorts_bold",
    defaultInstructions:
      "Make it dramatic and engaging. Use setup → conflict → resolution structure. Include detailed visual cues in brackets.",
    tags: ["entertainment", "story", "animation"],
  },
  {
    id: "multi_source_remix",
    name: "Multi-Source Remix",
    nameI18nKey: "presetMultiRemix",
    description:
      "Combine multiple references into a fresh, original narrative.",
    descriptionI18nKey: "presetMultiRemixDesc",
    adaptationMode: "remix",
    targetLanguage: "Korean",
    draftTemplateKey: "default",
    videoPresetId: "shorts_clean",
    defaultInstructions:
      "Synthesize the best ideas from all sources into a cohesive new story. Don't just concatenate — create something original.",
    tags: ["remix", "creative", "multi-source"],
  },
];

export function getContentFactoryPreset(
  id: string,
): ContentFactoryPreset | undefined {
  return CONTENT_FACTORY_PRESETS.find((p) => p.id === id);
}
