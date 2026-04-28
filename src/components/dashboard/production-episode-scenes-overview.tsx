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
        className="mb-8 border border-dashed border-ink-100 bg-paper-100 px-4 py-4"
        aria-labelledby="scenes-overview-heading"
      >
        <div className="flex items-start gap-3">
          <Film
            className="mt-0.5 h-5 w-5 shrink-0 text-ink-500"
            aria-hidden
          />
          <div className="min-w-0 space-y-2">
            <h2
              id="scenes-overview-heading"
              className="text-sm font-semibold text-ink-900"
            >
              {t("scenesOverviewHeading")}
            </h2>
            <p className="text-sm leading-relaxed text-ink-700">
              {t("scenesOverviewEmptyNoPlan")}
            </p>
            <p className="text-xs leading-relaxed text-ink-500">
              {t("scenesOverviewEmptyHint")}
            </p>
            <Link
              href={sceneRenderHref}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-vermilion-600 hover:underline"
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
      className="mb-8 border border-ink-100 bg-paper-100 px-4 py-4"
      aria-labelledby="scenes-overview-heading"
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <Film
            className="mt-0.5 h-5 w-5 shrink-0 text-vermilion-600"
            aria-hidden
          />
          <div className="min-w-0">
            <h2
              id="scenes-overview-heading"
              className="text-sm font-semibold text-ink-900"
            >
              {t("scenesOverviewHeading")}
            </h2>
            <p className="mt-1 max-w-prose text-xs leading-relaxed text-ink-500">
              {t("scenesOverviewDeck")}
            </p>
          </div>
        </div>
        <Link
          href={sceneRenderHref}
          className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-vermilion-600 hover:underline"
        >
          <Link2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {t("sceneCardOpenSceneRender")}
        </Link>
      </div>
      <p className="mb-3 font-mono text-[11px] text-ink-500">
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
                  "flex h-full flex-col border px-3 py-3",
                  ok
                    ? "border-vermilion-600/35 bg-paper-50"
                    : "border-ink-100 bg-paper-50",
                )}
              >
                <div className="font-mono text-[11px] uppercase tracking-[0.04em] text-ink-500">
                  {t("sceneCardTitle", { index: row.index })}
                </div>
                <div className="mt-1 font-mono text-[11px] tabular-nums text-ink-500">
                  {t("sceneCardDuration", { seconds: row.durationSeconds })}
                </div>
                <p className="mt-2 line-clamp-2 text-xs leading-snug text-ink-700">
                  {row.visualPrompt.trim() || row.narration.trim() || "—"}
                </p>
                <p
                  className={cn(
                    "mt-2 text-[11px] font-medium",
                    ok ? "text-vermilion-600" : "text-ink-500",
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
