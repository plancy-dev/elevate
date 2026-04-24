import { expect, type Page } from "@playwright/test";

type EpisodeTabTarget = "episode" | "pipeline";

/**
 * Hydration guard for the productions detail tab shell.
 * We intentionally toggle tabs once and return so subsequent clicks hit
 * React-bound handlers instead of pre-hydration native behavior.
 */
export async function ensureEpisodeTabsHydrated(
  page: Page,
  activeTab: EpisodeTabTarget,
): Promise<void> {
  const episodeTab = page.getByRole("tab", { name: /(Episode|에피소드)/i }).first();
  const pipelineTab = page.getByRole("tab", {
    name: /(Pipeline|파이프라인|제작)/i,
  }).first();

  const hasEpisodeTab = await episodeTab.isVisible().catch(() => false);
  const hasPipelineTab = await pipelineTab.isVisible().catch(() => false);
  if (!hasEpisodeTab || !hasPipelineTab) return;

  if (activeTab === "pipeline") {
    await episodeTab.click();
    await expect(episodeTab).toHaveAttribute("aria-selected", "true");
    await pipelineTab.click();
    await expect(pipelineTab).toHaveAttribute("aria-selected", "true");
    return;
  }

  await pipelineTab.click();
  await expect(pipelineTab).toHaveAttribute("aria-selected", "true");
  await episodeTab.click();
  await expect(episodeTab).toHaveAttribute("aria-selected", "true");
}

