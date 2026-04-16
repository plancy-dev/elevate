"use client";

import { useTranslations } from "next-intl";
import { LayoutList } from "lucide-react";
import type { StudioProductionArtifactRow } from "@/lib/data/studio-productions";
import {
  STUDIO_ARTIFACT_PHASE_ORDER,
  studioArtifactWorkflowPhase,
  type StudioArtifactWorkflowPhase,
} from "@/lib/studio-productions/studio-artifact-workflow-phase";

function excerpt(text: string, max: number): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

const PHASE_LABEL_KEY: Record<
  StudioArtifactWorkflowPhase,
  | "atAGlancePhaseInput"
  | "atAGlancePhaseDraft"
  | "atAGlancePhaseProduce"
  | "atAGlancePhaseOther"
> = {
  input: "atAGlancePhaseInput",
  draft: "atAGlancePhaseDraft",
  produce: "atAGlancePhaseProduce",
  other: "atAGlancePhaseOther",
};

function ArtifactMiniCard({ a }: { a: StudioProductionArtifactRow }) {
  return (
    <article
      className="film-strip-frame min-w-[220px] max-w-[260px] shrink-0 snap-start"
      role="listitem"
    >
      <div className="flex h-full min-h-[140px] max-h-[168px] flex-col rounded-md border border-border-subtle bg-layer-01/98 p-3 shadow-sm transition-colors hover:border-primary/30 dark:border-border-subtle dark:bg-layer-01/95 dark:hover:border-primary/35">
        <div className="mb-1.5 flex flex-wrap gap-1">
          <span className="inline-flex max-w-full items-center truncate rounded bg-primary/12 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary dark:bg-primary/20">
            {a.artifact_role}
          </span>
          <span className="inline-flex max-w-full items-center truncate rounded bg-layer-02/90 px-1.5 py-0.5 text-[10px] text-text-secondary dark:bg-white/5">
            {a.tool_platform}
          </span>
        </div>
        <p className="text-xs leading-snug text-text-primary line-clamp-6 whitespace-pre-wrap">
          {a.content_text.trim() ? excerpt(a.content_text, 160) : "—"}
        </p>
        {a.external_url ? (
          <p className="mt-auto pt-2 text-[10px] leading-tight">
            <a
              href={a.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-interactive line-clamp-2 break-all hover:underline"
            >
              {a.external_url}
            </a>
          </p>
        ) : null}
      </div>
    </article>
  );
}

export function ProductionEpisodeAtAGlance({
  notes,
  publishUrl,
  artifacts,
}: {
  notes: string;
  publishUrl: string | null;
  artifacts: StudioProductionArtifactRow[];
}) {
  const t = useTranslations("Dashboard.productions");
  const showNotes = notes.trim().length > 0;

  const byPhase = STUDIO_ARTIFACT_PHASE_ORDER.map((phase) => ({
    phase,
    items: artifacts
      .filter((a) => studioArtifactWorkflowPhase(a.artifact_role) === phase)
      .slice()
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
  })).filter((g) => g.items.length > 0);

  const hasArtifactDeck = byPhase.length > 0;

  return (
    <section
      className="mb-10 rounded-xl border border-border-subtle bg-layer-01 p-4 sm:p-5"
      aria-labelledby="at-a-glance-heading"
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <LayoutList className="h-4 w-4 shrink-0 text-text-tertiary" aria-hidden />
        <h2
          id="at-a-glance-heading"
          className="text-sm font-semibold tracking-tight text-text-primary"
        >
          {t("atAGlanceTitle")}
        </h2>
      </div>

      {publishUrl ? (
        <p className="mb-4 text-sm">
          <a
            href={publishUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline break-all"
          >
            {publishUrl}
          </a>
        </p>
      ) : null}

      {!hasArtifactDeck && !showNotes ? (
        <p className="text-sm text-text-tertiary leading-relaxed max-w-prose">
          {t("atAGlanceEmpty")}
        </p>
      ) : (
        <div
          className="rounded-lg border border-border-subtle/80 bg-layer-02/40 px-2 py-3"
          role="list"
        >
          <div className="space-y-4">
            {showNotes ? (
              <div>
                <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
                  {t("atAGlanceNotes")}
                </p>
                <div className="flex gap-2 overflow-x-auto overscroll-x-contain touch-pan-x pb-1 snap-x snap-mandatory scroll-pl-2 [scrollbar-width:thin] [-webkit-overflow-scrolling:touch]">
                  <div
                    className="film-strip-frame min-w-[220px] max-w-[260px] shrink-0 snap-start"
                    data-testid="at-glance-notes"
                  >
                    <div className="flex h-full min-h-[140px] flex-col rounded-md border border-border-subtle/90 bg-layer-01/98 p-3 shadow-sm dark:border-border-subtle dark:bg-layer-01/95">
                      <p className="text-xs text-text-secondary leading-relaxed line-clamp-8 whitespace-pre-wrap">
                        {notes.trim()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {byPhase.map(({ phase, items }) => (
              <div key={phase}>
                <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
                  {t(PHASE_LABEL_KEY[phase])}
                </p>
                <div className="flex gap-2 overflow-x-auto overscroll-x-contain touch-pan-x pb-1 pt-0.5 snap-x snap-mandatory scroll-pl-2 [scrollbar-width:thin] [-webkit-overflow-scrolling:touch]">
                  {items.map((a) => (
                    <ArtifactMiniCard key={a.id} a={a} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
