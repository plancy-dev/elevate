import { describe, expect, it } from "vitest";
import {
  appLocaleToElevenLabsLanguage,
  resolveVoiceIdFromPreset,
  ELEVENLABS_VOICE_ADAM,
  ELEVENLABS_VOICE_RACHEL,
} from "@/lib/studio-productions/elevenlabs-tts-presets";

describe("resolveVoiceIdFromPreset", () => {
  it("maps female to Rachel", () => {
    expect(resolveVoiceIdFromPreset("female", undefined).voiceId).toBe(
      ELEVENLABS_VOICE_RACHEL,
    );
  });
  it("maps male to Adam", () => {
    expect(resolveVoiceIdFromPreset("male", undefined).voiceId).toBe(
      ELEVENLABS_VOICE_ADAM,
    );
  });
  it("requires custom voice id when preset is custom", () => {
    expect(resolveVoiceIdFromPreset("custom", "").error).toBe("custom_voice_required");
    expect(resolveVoiceIdFromPreset("custom", "abc").voiceId).toBe("abc");
  });
});

describe("appLocaleToElevenLabsLanguage", () => {
  it("maps app locales to provider codes", () => {
    expect(appLocaleToElevenLabsLanguage("ko")).toBe("ko");
    expect(appLocaleToElevenLabsLanguage("ja")).toBe("ja");
    expect(appLocaleToElevenLabsLanguage("zh-CN")).toBe("zh");
    expect(appLocaleToElevenLabsLanguage("zh-TW")).toBe("zh");
    expect(appLocaleToElevenLabsLanguage("en")).toBe("en");
  });
});
