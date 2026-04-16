/**
 * ElevenLabs TTS UI presets (voice IDs are public; keys are not).
 * @see https://elevenlabs.io/docs/api-reference/text-to-speech
 */

/** Rachel — common default multilingual voice */
export const ELEVENLABS_VOICE_RACHEL = "21m00Tcm4TlvDq8ikWAM";
/** Adam — common male preset */
export const ELEVENLABS_VOICE_ADAM = "pNInz6obpgDQGcFmaJgB";

export type ElevenLabsTtsVoicePreset = "female" | "male" | "custom";

export function resolveVoiceIdFromPreset(
  preset: string,
  customVoiceId: string | undefined,
): { voiceId: string | undefined; error?: "custom_voice_required" } {
  const p = preset.trim() as ElevenLabsTtsVoicePreset;
  if (p === "custom") {
    const id = customVoiceId?.trim();
    if (!id) return { voiceId: undefined, error: "custom_voice_required" };
    return { voiceId: id };
  }
  if (p === "male") return { voiceId: ELEVENLABS_VOICE_ADAM };
  if (p === "female") return { voiceId: ELEVENLABS_VOICE_RACHEL };
  return { voiceId: undefined };
}

/** Maps dashboard / next-intl locale to ElevenLabs `language_code` (multilingual models). */
export function appLocaleToElevenLabsLanguage(locale: string): string {
  switch (locale) {
    case "ko":
      return "ko";
    case "ja":
      return "ja";
    case "zh-CN":
    case "zh-TW":
      return "zh";
    default:
      return "en";
  }
}

export type ElevenLabsLanguageOption = {
  value: string;
  /** i18n key under Dashboard.productions */
  labelKey: string;
};

/** `value` empty string = omit `language_code` (provider default). */
export const ELEVENLABS_LANGUAGE_SELECT_OPTIONS: ElevenLabsLanguageOption[] = [
  { value: "", labelKey: "pipelineProduceLanguageOptionAuto" },
  { value: "en", labelKey: "pipelineProduceLanguageOptionEn" },
  { value: "ko", labelKey: "pipelineProduceLanguageOptionKo" },
  { value: "ja", labelKey: "pipelineProduceLanguageOptionJa" },
  { value: "zh", labelKey: "pipelineProduceLanguageOptionZh" },
];
