"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  extractReferenceTranscript,
  adaptReferencesToScript,
  deleteStudioReferenceSource,
  type ReferenceActionState,
} from "@/actions/studio-reference";
import { Trash2 } from "lucide-react";
import { translateActionErrorMessage } from "@/lib/i18n/translate-action-error";
import type { ReferenceSourceType } from "@/lib/studio-productions/reference-source";
import type { StudioProductionArtifactRow } from "@/lib/data/studio-productions";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/ui/app-toast";
import { cn } from "@/lib/utils";

type Props = {
  episodeId: string;
  artifacts: StudioProductionArtifactRow[];
  className?: string;
  /** When the parent already shows a panel intro (title + subtitle). */
  omitSectionHeader?: boolean;
};

function useRefActionToast(
  state: ReferenceActionState,
  successKey: string,
  t: ReturnType<typeof useTranslations>,
  tAction: ReturnType<typeof useTranslations>,
  router: ReturnType<typeof useRouter>,
) {
  const handledRef = useRef<ReferenceActionState>(null);
  useEffect(() => {
    if (!state || handledRef.current === state) return;
    handledRef.current = state;
    if (state.ok) {
      toast.success(t(successKey));
      router.refresh();
    } else if (state.error) {
      toast.error(translateActionErrorMessage(state.error, tAction));
    }
  }, [state, successKey, t, tAction, router]);
}

function sourceTypeLabel(
  t: ReturnType<typeof useTranslations>,
  st: string | undefined,
): string {
  switch (st) {
    case "youtube_url":
      return t("referenceKindYoutube");
    case "web_url":
      return t("referenceKindWeb");
    case "manual_note":
      return t("referenceKindNote");
    case "text":
    default:
      return t("referenceKindText");
  }
}

export function ProductionEpisodeReferencePanel({
  episodeId,
  artifacts,
  className,
  omitSectionHeader = false,
}: Props) {
  const t = useTranslations("Dashboard.productions");
  const tAction = useTranslations("Dashboard.actionErrors");
  const router = useRouter();
  const [sourceType, setSourceType] = useState<ReferenceSourceType>("youtube_url");

  const refSources = artifacts.filter((a) => a.artifact_role === "reference_source");

  const [extractState, extractAction, extractPending] = useActionState(
    extractReferenceTranscript,
    null,
  );
  const [adaptState, adaptAction, adaptPending] = useActionState(
    adaptReferencesToScript,
    null,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteStudioReferenceSource,
    null,
  );

  useRefActionToast(extractState, "referenceExtractSuccess", t, tAction, router);
  useRefActionToast(adaptState, "referenceAdaptSuccess", t, tAction, router);
  useRefActionToast(deleteState, "referenceDeleteSuccess", t, tAction, router);

  return (
    <div className={cn("flex flex-col gap-4 border-t border-ink-100 pt-5", className)}>
      {!omitSectionHeader ? (
        <div>
          <h3 className="text-sm font-semibold text-ink-900">
            {t("referenceTitle")}
          </h3>
          <p className="mt-1 text-xs text-ink-500 leading-relaxed">
            {t("referenceSubtitle")}
          </p>
        </div>
      ) : null}

      {refSources.length > 0 ? (
        <div className="rounded-[var(--radius-1)] border border-ink-100 bg-paper-50/30 p-3">
          <p className="text-xs font-medium text-ink-700 mb-2">
            {t("referenceSourceCount", { count: refSources.length })}
          </p>
          <ul className="space-y-1.5">
            {refSources.map((ref) => {
              const meta = (ref.metadata ?? {}) as Record<string, string>;
              const st = meta.source_type;
              const sourceLabel = meta.source_label || ref.artifact_role;
              return (
                <li
                  key={ref.id}
                  className="flex gap-2 text-xs text-ink-500 items-start"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-ink-700 font-medium">
                      [{sourceTypeLabel(t, st)}]
                    </span>{""}
                    <span className="truncate">{sourceLabel}</span>
                    {ref.content_text ? (
                      <span className="block text-ink-500/90 mt-0.5 line-clamp-2">
                        {ref.content_text.slice(0, 200)}
                        {ref.content_text.length > 200 ? "…" : ""}
                      </span>
                    ) : null}
                  </div>
                  <form
                    action={deleteAction}
                    className="shrink-0"
                    onSubmit={(e) => {
                      if (!confirm(t("referenceDeleteConfirm"))) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <input type="hidden" name="episode_id" value={episodeId} />
                    <input type="hidden" name="artifact_id" value={ref.id} />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-ink-500 hover:text-destructive"
                      isLoading={deletePending}
                      aria-label={t("referenceDeleteCta")}
                      title={t("referenceDeleteCta")}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </Button>
                  </form>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <form action={extractAction} className="space-y-3">
        <input type="hidden" name="episode_id" value={episodeId} />
        <input type="hidden" name="source_type" value={sourceType} />

        <div className="flex flex-wrap gap-2">
          {(
            [
              ["youtube_url", t("referenceAddYoutube")],
              ["web_url", t("referenceAddWebUrl")],
              ["text", t("referenceAddText")],
              ["manual_note", t("referenceAddNote")],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setSourceType(id)}
              className={cn(
                "rounded-[var(--radius-1)] px-3 py-1.5 text-xs font-medium transition-colors",
                sourceType === id
                  ? "bg-primary/10 text-primary border border-primary/30"
                  : "text-ink-700 hover:bg-paper-50",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {sourceType === "youtube_url" ? (
          <input
            name="source_value"
            required
            placeholder={t("referenceUrlPlaceholder")}
            className="h-10 w-full rounded-[var(--radius-1)] border border-ink-100 bg-paper-0 px-3 text-sm"
          />
        ) : null}

        {sourceType === "web_url" ? (
          <>
            <p className="text-xs text-ink-500 leading-relaxed">
              {t("referenceWebUrlHint")}
            </p>
            <input
              name="source_value"
              required
              placeholder={t("referenceWebUrlPlaceholder")}
              className="h-10 w-full rounded-[var(--radius-1)] border border-ink-100 bg-paper-0 px-3 text-sm"
            />
          </>
        ) : null}

        {sourceType === "text" ? (
          <>
            <input
              name="source_label"
              placeholder={t("referenceLabelPlaceholder")}
              className="h-10 w-full rounded-[var(--radius-1)] border border-ink-100 bg-paper-0 px-3 text-sm"
            />
            <textarea
              name="source_value"
              required
              rows={5}
              placeholder={t("referenceTextPlaceholder")}
              className="w-full rounded-[var(--radius-1)] border border-ink-100 bg-paper-0 px-3 py-2 text-sm"
            />
          </>
        ) : null}

        {sourceType === "manual_note" ? (
          <>
            <p className="text-xs text-ink-500 leading-relaxed">
              {t("referenceNoteHint")}
            </p>
            <input
              name="source_label"
              placeholder={t("referenceNoteLabelPlaceholder")}
              className="h-10 w-full rounded-[var(--radius-1)] border border-ink-100 bg-paper-0 px-3 text-sm"
            />
            <textarea
              name="source_value"
              required
              rows={5}
              placeholder={t("referenceNotePlaceholder")}
              className="w-full rounded-[var(--radius-1)] border border-ink-100 bg-paper-0 px-3 py-2 text-sm"
            />
          </>
        ) : null}

        <Button type="submit" variant="secondary" size="sm" isLoading={extractPending}>
          {sourceType === "web_url"
            ? t("referenceExtractWebCta")
            : sourceType === "manual_note"
              ? t("referenceSaveNoteCta")
              : t("referenceExtractCta")}
        </Button>
      </form>

      {refSources.length > 0 ? (
        <form action={adaptAction} className="space-y-3 border-t border-ink-100 pt-4">
          <input type="hidden" name="episode_id" value={episodeId} />

          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1.5">
              {t("referenceAdaptMode")}
            </label>
            <select
              name="mode"
              defaultValue="translate"
              className="h-10 w-full rounded-[var(--radius-1)] border border-ink-100 bg-paper-0 px-3 text-sm"
            >
              <option value="translate">{t("referenceAdaptModeTranslate")}</option>
              <option value="summarize">{t("referenceAdaptModeSummarize")}</option>
              <option value="remix">{t("referenceAdaptModeRemix")}</option>
              <option value="book_review_short">{t("referenceAdaptModeBookShort")}</option>
              <option value="book_review_long">{t("referenceAdaptModeBookLong")}</option>
              <option value="storytelling_animation">{t("referenceAdaptModeStory")}</option>
              <option value="news_summary">{t("referenceAdaptModeNews")}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1.5">
              {t("referenceTargetLanguage")}
            </label>
            <input
              name="target_language"
              defaultValue="Korean"
              className="h-10 w-full rounded-[var(--radius-1)] border border-ink-100 bg-paper-0 px-3 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1.5">
              {t("referenceInstructions")}
            </label>
            <textarea
              name="instructions"
              rows={2}
              className="w-full rounded-[var(--radius-1)] border border-ink-100 bg-paper-0 px-3 py-2 text-sm"
            />
          </div>

          <Button type="submit" variant="primary" size="sm" isLoading={adaptPending}>
            {t("referenceAdaptCta")}
          </Button>
        </form>
      ) : null}
    </div>
  );
}
