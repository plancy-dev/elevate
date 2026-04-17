"use client";

import { BookOpen, ChevronDown, ExternalLink, Layers } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { StudioProductionArtifactRow } from "@/lib/data/studio-productions";
import {
  listPipelineReferenceSources,
  type PipelineReferenceSourceItem,
} from "@/lib/studio-productions/pipeline-reference-context";
import { cn } from "@/lib/utils";

type Props = {
  artifacts: StudioProductionArtifactRow[];
  onOpenReferences: () => void;
};

/** Read-only list of INIT/reference sources for the pipeline tab; full editing opens in a dialog. */
export function PipelineReferenceSourcesStrip({ artifacts, onOpenReferences }: Props) {
  const t = useTranslations("Dashboard.productions");
  const items = useMemo(() => listPipelineReferenceSources(artifacts), [artifacts]);
  const [open, setOpen] = useState(true);

  function kindLabel(st: PipelineReferenceSourceItem["sourceType"]): string {
    switch (st) {
      case "youtube_url":
        return t("referenceKindYoutube");
      case "web_url":
        return t("referenceKindWeb");
      case "manual_note":
        return t("referenceKindNote");
      case "text":
        return t("referenceKindText");
      default:
        return t("referenceKindText");
    }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border-subtle/90 bg-gradient-to-b from-layer-02/50 to-layer-02/25 px-4 py-4 shadow-sm ring-1 ring-black/[0.02] dark:ring-white/[0.03]">
        <div className="flex gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
            aria-hidden
          >
            <Layers className="h-5 w-5 opacity-90" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-text-primary leading-snug">
              {t("pipelineInputSourcesTitle")}
            </p>
            <p className="mt-1 text-xs text-text-secondary leading-relaxed">
              {t("pipelineInputSourcesEmpty")}
            </p>
            <Button
              type="button"
              variant="tertiary"
              size="sm"
              className="mt-3 h-8 px-3 text-xs"
              onClick={onOpenReferences}
            >
              {t("episodePanelHeadReferences")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border-subtle/90 bg-layer-02/40 px-3 py-2.5 shadow-sm ring-1 ring-black/[0.02] dark:ring-white/[0.03]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex min-h-10 min-w-0 flex-1 items-center justify-between gap-2 rounded-lg text-left transition-colors hover:bg-layer-01/40 -mx-0.5 px-0.5"
          aria-expanded={open}
        >
          <span className="inline-flex min-w-0 items-center gap-2">
            <BookOpen className="h-4 w-4 shrink-0 text-primary/90" aria-hidden />
            <span className="text-sm font-medium text-text-primary">
              {t("pipelineInputSourcesTitle")}
            </span>
            <span className="text-[11px] text-text-tertiary tabular-nums">({items.length})</span>
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-text-tertiary transition-transform duration-200",
              open && "rotate-180",
            )}
            aria-hidden
          />
        </button>
        <Button
          type="button"
          variant="tertiary"
          size="sm"
          className="h-8 shrink-0 self-start px-3 text-xs sm:self-center"
          onClick={onOpenReferences}
        >
          {t("episodePanelHeadReferences")}
        </Button>
      </div>
      {open ? (
        <ul role="list" className="mt-2 space-y-2 border-t border-border-subtle/60 pt-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-md bg-layer-01/60 px-2.5 py-2 dark:bg-layer-02/35"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
                [{kindLabel(item.sourceType)}]
              </p>
              <p className="mt-0.5 text-xs font-medium text-text-primary line-clamp-2">
                {item.label}
              </p>
              {item.href ? (
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  {t("pipelineInputSourcesOpenLink")}
                </a>
              ) : null}
              {item.contentPreview ? (
                <p className="mt-1.5 text-[11px] text-text-tertiary leading-relaxed line-clamp-3">
                  {item.contentPreview}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
