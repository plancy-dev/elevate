/** Sub-panels inside workbench `tab=episode` (query `episodePanel`). */
export const EPISODE_DETAIL_PANEL_IDS = [
  "references",
  "pipeline",
  "detail",
] as const;

export type EpisodeDetailPanelId = (typeof EPISODE_DETAIL_PANEL_IDS)[number];

/** Default when `episodePanel` is missing. */
export const DEFAULT_EPISODE_DETAIL_PANEL: EpisodeDetailPanelId = "pipeline";

export function parseEpisodeDetailPanelParam(
  value: string | null,
): EpisodeDetailPanelId | null {
  if (value === "detail" || value === "references" || value === "pipeline") {
    return value;
  }
  /** Legacy URLs (`episodePanel=draft`); hook/script lived in a removed sub-tab — open pipeline (draft via modal). */
  if (value === "draft") {
    return "pipeline";
  }
  return null;
}
