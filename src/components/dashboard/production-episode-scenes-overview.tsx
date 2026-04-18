"use client";

import { Film, Link2 } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useSearchParams } from "next/navigation";
import type { StudioProductionArtifactRow } from "@/lib/data/studio-productions";
import type { EpisodeScenePlanRow } from "@/lib/studio-productions/episode-scene-plan-dto";
import {
  parseSceneClipMetadata,
  type SceneClipMetadata,
} from "@/lib/studio-productions/scene-clip-metadata";
import type { Json } from "@/types/database.types";
import { cn } from "@/lib/utils";

function latestClipForIndex(
  clips: StudioProductionArtifactRow[],
  index: number,
  positionFallback: number,
): StudioProductionArtifactRow | null {
  const withMeta = clips.filter((c) => {
    const m = parseSceneClipMetadata(c.metadata as Json, -1);
    return m?.scene_index === index;
  });
  if (withMeta.length > 0) {
    return [...withMeta].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )[0]!;
  }
  const sorted = [...clips].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );
  return sorted[positionFallback] ?? null;
}

function clipStatusLabel(
  row: StudioProductionArtifactRow | null,
  meta: SceneClipMetadata | null,
  t: (key: string) => string,
): { line: string; ok: boolean } {
  if (!row?.external_url?.trim()) {
    return { line: t("sceneCardClipMissing"), ok: false };
  }
  if (!meta) {
    return { line: t("sceneCardClipReady"), ok: true };
  }
  const src =
    meta.source === "upload"
      ? t("sceneCardClipSourceUpload")
      : t("sceneCardClipSourceRunway");
  return { line: `${t("sceneCardClipReady")} · ${src}`, ok: true };
}

export function ProductionEpisodeScenesOverview({
  scenePlanRows,
  artifacts,
}: {
  scenePlanRows: EpisodeScenePlanRow[] | null;
  artifacts: StudioProductionArtifactRow[];
}) {
  const t = useTranslations("Dashboard.productions");
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const sceneRenderHref = useMemo(() => {
    const q = new URLSearchParams(searchParams.toString());
    q.set("tab", "episode");
    q.set("episodePanel", "pipeline");
    const qs = q.toString();
    return qs ? `${pathname}?${qs}#scene-render-pipeline` : `${pathname}#scene-render-pipeline`;
  }, [pathname, searchParams]);

  const sceneClips = useMemo(
    () =>
      artifacts.filter(
        (a) => a.artifact_role === "scene_clip" && a.external_url?.trim(),
      ),
    [artifacts],
  );

  const allSceneClips = useMemo(
    () => artifacts.filter((a) => a.artifact_role === "scene_clip"),
    [artifacts],
  );

  if (!scenePlanRows || scenePlanRows.length === 0) {
    return (
      <section
        className="mb-8 rounded-xl border border-dashed border-border-subtle bg-layer-02/25 px-4 py-4 dark:border-border-subtle"
        aria-labelledby="scenes-overview-heading"
      >
        <div className="flex items-start gap-3">
          <Film
            className="mt-0.5 h-5 w-5 shrink-0 text-text-tertiary"
            aria-hidden
          />
          <div className="min-w-0 space-y-2">
            <h2
              id="scenes-overview-heading"
              className="text-sm font-semibold text-text-primary"
            >
              {t("scenesOverviewHeading")}
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              {t("scenesOverviewEmptyNoPlan")}
            </p>
            <p className="text-xs text-text-tertiary leading-relaxed">
              {t("scenesOverviewEmptyHint")}
            </p>
            <Link
              href={sceneRenderHref}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-interactive hover:underline"
            >
              <Link2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {t("sceneCardOpenSceneRender")}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="mb-8 rounded-xl border border-border-subtle bg-layer-02/30 px-4 py-4 dark:border-border-subtle dark:bg-layer-02/40"
      aria-labelledby="scenes-overview-heading"
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <Film
            className="mt-0.5 h-5 w-5 shrink-0 text-primary"
            aria-hidden
          />
          <div className="min-w-0">
            <h2
              id="scenes-overview-heading"
              className="text-sm font-semibold text-text-primary"
            >
              {t("scenesOverviewHeading")}
            </h2>
            <p className="mt-1 text-xs text-text-tertiary leading-relaxed max-w-prose">
              {t("scenesOverviewDeck")}
            </p>
          </div>
        </div>
        <Link
          href={sceneRenderHref}
          className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-interactive hover:underline"
        >
          <Link2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {t("sceneCardOpenSceneRender")}
        </Link>
      </div>
      <p className="mb-3 text-[11px] text-text-tertiary">
        {t("scenesOverviewClipCount", { count: sceneClips.length })}
      </p>
      <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2">
        {scenePlanRows.map((row, position) => {
          const clip = latestClipForIndex(allSceneClips, row.index, position);
          const meta = clip
            ? parseSceneClipMetadata(clip.metadata as Json, row.index)
            : null;
          const { line, ok } = clipStatusLabel(clip, meta, t);
          return (
            <li key={row.index}>
              <div
                className={cn(
                  "flex h-full flex-col rounded-lg border px-3 py-3",
                  ok
                    ? "border-green-500/30 bg-green-500/[0.04]"
                    : "border-border-subtle bg-layer-01/40 dark:border-border-subtle",
                )}
              >
                <div className="text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">
                  {t("sceneCardTitle", { index: row.index })}
                </div>
                <div className="mt-1 text-[11px] text-text-tertiary tabular-nums">
                  {t("sceneCardDuration", { seconds: row.durationSeconds })}
                </div>
                <p className="mt-2 line-clamp-2 text-xs text-text-secondary leading-snug">
                  {row.visualPrompt.trim() || row.narration.trim() || "—"}
                </p>
                <p
                  className={cn(
                    "mt-2 text-[11px] font-medium",
                    ok ? "text-green-700 dark:text-green-400/90" : "text-text-tertiary",
                  )}
                >
                  {line}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
