/** Sub-panels inside workbench `tab=episode` (query `episodePanel`). */
export const EPISODE_DETAIL_PANEL_IDS = [
  "references",
  "draft",
  "pipeline",
  "detail",
] as const;

export type EpisodeDetailPanelId = (typeof EPISODE_DETAIL_PANEL_IDS)[number];

/** Default when `episodePanel` is missing: main writing surface. */
export const DEFAULT_EPISODE_DETAIL_PANEL: EpisodeDetailPanelId = "draft";

export function parseEpisodeDetailPanelParam(
  value: string | null,
): EpisodeDetailPanelId | null {
  if (
    value === "detail" ||
    value === "draft" ||
    value === "references" ||
    value === "pipeline"
  ) {
    return value;
  }
  return null;
}
