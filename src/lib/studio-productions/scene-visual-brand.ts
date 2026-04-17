import "server-only";

import { slicePromptUtf16 } from "@/lib/studio-integrations/providers/runway/runway-text-to-video";

const BRAND_MAX = 600;

/**
 * Prefix Runway visual prompts with project brand guide for stylistic consistency.
 */
export function applyBrandGuideToVisualPrompt(
  visualPrompt: string,
  brandGuide: string | null | undefined,
): string {
  const g = (brandGuide ?? "").trim();
  if (!g) return visualPrompt.trim();
  const brandSlice = g.length > BRAND_MAX ? `${g.slice(0, BRAND_MAX)}…` : g;
  const combined = `[Brand continuity — follow this voice and look: ${brandSlice}]\n\n${visualPrompt.trim()}`;
  return slicePromptUtf16(combined, 1000);
}

/**
 * Brand guide + optional user suffix for Runway (1000 UTF-16 code units max).
 */
export function buildRunwayScenePrompt(
  visualPrompt: string,
  brandGuide: string | null | undefined,
  visualSuffix: string | null | undefined,
): string {
  const base = applyBrandGuideToVisualPrompt(visualPrompt, brandGuide);
  const suf = (visualSuffix ?? "").trim();
  if (!suf) return base;
  return slicePromptUtf16(`${base}\n\n${suf}`, 1000);
}
