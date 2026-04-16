/**
 * T3: Video editing presets for FFmpeg assembly.
 * Each preset defines overlay, subtitle, and composition parameters
 * that extend the base video-assembly.ts FFmpeg command builder.
 */

export type TitleOverlayConfig = {
  text: string;
  position: "top" | "center" | "bottom";
  fontSize: number;
  fontColor: string;
  backgroundColor: string;
  backgroundOpacity: number;
  durationSeconds: number;
  fadeInSeconds: number;
};

export type SubtitleStyleConfig = {
  fontSize: number;
  fontColor: string;
  outlineColor: string;
  outlineWidth: number;
  position: "bottom" | "center";
  backgroundColor: string;
  backgroundOpacity: number;
};

export type WatermarkConfig = {
  imageUrl: string;
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  opacity: number;
  scale: number;
};

export type IntroOutroConfig = {
  introClipUrl?: string;
  outroClipUrl?: string;
  introDurationSeconds?: number;
  outroDurationSeconds?: number;
};

export type VideoPreset = {
  id: string;
  name: string;
  titleOverlay?: TitleOverlayConfig;
  subtitleStyle?: SubtitleStyleConfig;
  watermark?: WatermarkConfig;
  introOutro?: IntroOutroConfig;
  aspectRatio: "9:16" | "16:9" | "1:1";
  resolution: { width: number; height: number };
};

export const DEFAULT_VIDEO_PRESETS: VideoPreset[] = [
  {
    id: "shorts_clean",
    name: "Shorts — Clean",
    titleOverlay: {
      text: "",
      position: "top",
      fontSize: 42,
      fontColor: "#FFFFFF",
      backgroundColor: "#000000",
      backgroundOpacity: 0.6,
      durationSeconds: 5,
      fadeInSeconds: 0.5,
    },
    subtitleStyle: {
      fontSize: 28,
      fontColor: "#FFFFFF",
      outlineColor: "#000000",
      outlineWidth: 2,
      position: "bottom",
      backgroundColor: "#000000",
      backgroundOpacity: 0.4,
    },
    aspectRatio: "9:16",
    resolution: { width: 1080, height: 1920 },
  },
  {
    id: "shorts_bold",
    name: "Shorts — Bold Text",
    titleOverlay: {
      text: "",
      position: "center",
      fontSize: 56,
      fontColor: "#FFD700",
      backgroundColor: "#1a1a2e",
      backgroundOpacity: 0.8,
      durationSeconds: 4,
      fadeInSeconds: 0.3,
    },
    subtitleStyle: {
      fontSize: 32,
      fontColor: "#FFFFFF",
      outlineColor: "#FF4444",
      outlineWidth: 3,
      position: "bottom",
      backgroundColor: "#000000",
      backgroundOpacity: 0.5,
    },
    aspectRatio: "9:16",
    resolution: { width: 1080, height: 1920 },
  },
  {
    id: "longform_standard",
    name: "Long-form — Standard",
    subtitleStyle: {
      fontSize: 24,
      fontColor: "#FFFFFF",
      outlineColor: "#000000",
      outlineWidth: 2,
      position: "bottom",
      backgroundColor: "#000000",
      backgroundOpacity: 0.3,
    },
    aspectRatio: "16:9",
    resolution: { width: 1920, height: 1080 },
  },
];

/**
 * Build FFmpeg filter_complex string for title overlay.
 */
export function buildTitleOverlayFilter(config: TitleOverlayConfig): string {
  if (!config.text) return "";

  const yMap = { top: "h*0.08", center: "(h-text_h)/2", bottom: "h*0.85" };
  const y = yMap[config.position];

  return (
    `drawtext=text='${config.text.replace(/'/g, "'\\''")}'` +
    `:fontsize=${config.fontSize}` +
    `:fontcolor=${config.fontColor}` +
    `:x=(w-text_w)/2:y=${y}` +
    `:box=1:boxcolor=${config.backgroundColor}@${config.backgroundOpacity}` +
    `:boxborderw=12` +
    `:enable='between(t,0,${config.durationSeconds})'`
  );
}

/**
 * Build FFmpeg subtitle style override (ASS format string).
 */
export function buildSubtitleStyleOverride(config: SubtitleStyleConfig): string {
  return (
    `FontSize=${config.fontSize},` +
    `PrimaryColour=&H${hexToAss(config.fontColor)},` +
    `OutlineColour=&H${hexToAss(config.outlineColor)},` +
    `Outline=${config.outlineWidth},` +
    `BackColour=&H${Math.round(config.backgroundOpacity * 255).toString(16).padStart(2, "0")}${hexToAss(config.backgroundColor).slice(2)},` +
    `Alignment=${config.position === "center" ? 5 : 2},` +
    `MarginV=${config.position === "center" ? 0 : 30}`
  );
}

function hexToAss(hex: string): string {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return "00FFFFFF";
  const r = clean.slice(0, 2);
  const g = clean.slice(2, 4);
  const b = clean.slice(4, 6);
  return `00${b}${g}${r}`;
}
