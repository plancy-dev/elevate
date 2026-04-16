"use client";

import { createPortal } from "react-dom";
import {
  startTransition,
  useActionState,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useTranslations } from "next-intl";
import {
  createStudioDraftTemplate,
  deleteStudioDraftTemplate,
  listStudioDraftTemplatesForCurrentOrg,
  updateStudioDraftTemplate,
  type StudioDraftTemplateActionState,
} from "@/actions/studio-draft-templates";
import { translateActionErrorMessage } from "@/lib/i18n/translate-action-error";
import type { StudioEpisodeDraftTemplateRow } from "@/lib/data/studio-draft-templates";
import {
  STUDIO_DRAFT_TEMPLATE_BIAS_MAX,
  STUDIO_DRAFT_TEMPLATE_NAME_MAX,
} from "@/lib/studio-productions/draft-prompt-templates";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/ui/app-toast";
import { modalPanelClassName } from "@/lib/design-system-classes";
import { cn } from "@/lib/utils";

const initialState: StudioDraftTemplateActionState = undefined;

/** Shared styles: bias hint + textarea + char limit (create + edit). */
const biasFieldSectionClassName = cn(
  "space-y-2 rounded-lg border border-border-subtle/90 bg-field/80 p-3",
  "dark:border-border-subtle dark:bg-layer-02/50",
);

const biasTextareaClassName = cn(
  "min-h-[220px] w-full resize-y rounded-lg border border-border-subtle bg-field px-3 py-2.5",
  "text-sm leading-relaxed font-mono text-text-primary placeholder:text-text-tertiary sm:min-h-[260px]",
);

const nameInputClassName =
  "h-10 w-full rounded-lg border border-border-subtle bg-field px-3 text-sm";

type Props = {
  templates: StudioEpisodeDraftTemplateRow[];
  onTemplatesChange: (templates: StudioEpisodeDraftTemplateRow[]) => void;
};

export function DraftTemplateManageDialog({ templates, onTemplatesChange }: Props) {
  const t = useTranslations("Dashboard.productions");
  const tAction = useTranslations("Dashboard.actionErrors");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const fieldIdPrefix = useId();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const [createState, createAction, createPending] = useActionState(
    createStudioDraftTemplate,
    initialState,
  );
  const [updateState, updateAction, updatePending] = useActionState(
    updateStudioDraftTemplate,
    initialState,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteStudioDraftTemplate,
    initialState,
  );

  useEffect(() => {
    startTransition(() => setMounted(true));
  }, []);

  const refreshList = useCallback(async () => {
    const res = await listStudioDraftTemplatesForCurrentOrg();
    if (res.ok) {
      startTransition(() => onTemplatesChange(res.templates));
    } else {
      toast.error(translateActionErrorMessage(res.error, tAction));
    }
  }, [onTemplatesChange, tAction]);

  const prevCreatePending = useRef(false);
  const prevUpdatePending = useRef(false);
  const prevDeletePending = useRef(false);

  useEffect(() => {
    if (prevCreatePending.current && !createPending) {
      if (createState?.success === "saved") {
        toast.success(t("draftTemplateManageToastSaved"));
        void refreshList();
      } else if (createState?.error) {
        toast.error(translateActionErrorMessage(createState.error, tAction));
      }
    }
    prevCreatePending.current = createPending;
  }, [createPending, createState, refreshList, t, tAction]);

  useEffect(() => {
    if (prevUpdatePending.current && !updatePending) {
      if (updateState?.success === "saved") {
        toast.success(t("draftTemplateManageToastSaved"));
        startTransition(() => setEditingId(null));
        void refreshList();
      } else if (updateState?.error) {
        toast.error(translateActionErrorMessage(updateState.error, tAction));
      }
    }
    prevUpdatePending.current = updatePending;
  }, [updatePending, updateState, refreshList, t, tAction]);

  useEffect(() => {
    if (prevDeletePending.current && !deletePending) {
      if (deleteState?.success === "deleted") {
        toast.success(t("draftTemplateManageToastDeleted"));
        void refreshList();
      } else if (deleteState?.error) {
        toast.error(translateActionErrorMessage(deleteState.error, tAction));
      }
    }
    prevDeletePending.current = deletePending;
  }, [deletePending, deleteState, refreshList, t, tAction]);

  useLayoutEffect(() => {
    if (!editingId) return;
    const el = document.querySelector<HTMLElement>(
      `[data-draft-template-edit="${editingId}"]`,
    );
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [editingId]);

  const dialog = (
    <dialog
      ref={dialogRef}
      className="fixed left-1/2 top-1/2 z-200 m-0 max-h-[min(92vh,52rem)] w-[min(100vw-1.5rem,min(96vw,42rem))] max-w-[calc(100vw-1.5rem)] -translate-x-1/2 -translate-y-1/2 border-0 bg-transparent p-0 backdrop:bg-black/45 dark:backdrop:bg-black/60"
      aria-labelledby={titleId}
      onClose={() => setEditingId(null)}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          dialogRef.current?.close();
        }
      }}
    >
      <div
        className={cn(
          "flex max-h-[min(92vh-1rem,52rem)] flex-col overflow-hidden",
          modalPanelClassName,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-border-subtle/80 px-5 pb-4 pt-5 dark:border-border-subtle">
          <h3
            id={titleId}
            className="text-base font-semibold text-text-primary mb-1 pr-8 sm:text-lg"
          >
            {t("draftTemplateManageTitle")}
          </h3>
          <p className="text-xs text-text-tertiary leading-relaxed">
            {t("draftTemplateManageIntro")}
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <ul className="space-y-3">
            {templates.length === 0 ? (
              <li className="text-sm text-text-tertiary">{t("draftTemplateManageEmpty")}</li>
            ) : (
              templates.map((row) => {
                const nameInputId = `${fieldIdPrefix}-name-${row.id}`;
                const biasInputId = `${fieldIdPrefix}-bias-${row.id}`;
                return (
                <li
                  key={row.id}
                  data-draft-template-edit={editingId === row.id ? row.id : undefined}
                  className={
                    editingId === row.id
                      ? "rounded-xl border-2 border-primary/35 bg-primary/6 p-4 shadow-sm ring-1 ring-primary/15 dark:border-primary/40 dark:bg-primary/8"
                      : "rounded-lg border border-border-subtle/80 bg-layer-02/30 p-3 dark:border-border-subtle"
                  }
                >
                  {editingId === row.id ? (
                    <form action={updateAction} className="space-y-5">
                      <input type="hidden" name="template_id" value={row.id} />
                      <div>
                        <p className="text-xs font-semibold text-text-primary mb-3">
                          {t("draftTemplateManageEditingTitle")}
                        </p>
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <label
                              htmlFor={nameInputId}
                              className="block text-xs font-medium text-text-secondary"
                            >
                              {t("draftTemplateManageNameLabel")}
                            </label>
                            <input
                              id={nameInputId}
                              name="name"
                              required
                              maxLength={STUDIO_DRAFT_TEMPLATE_NAME_MAX}
                              defaultValue={row.name}
                              className={nameInputClassName}
                            />
                          </div>
                          <div className={biasFieldSectionClassName}>
                            <label
                              htmlFor={biasInputId}
                              className="block text-xs font-medium text-text-secondary"
                            >
                              {t("draftTemplateManageBiasLabel")}
                            </label>
                            <p className="text-[11px] text-text-tertiary leading-relaxed">
                              {t("draftTemplateManageBiasHint")}
                            </p>
                            <textarea
                              id={biasInputId}
                              name="bias_body"
                              required
                              rows={14}
                              maxLength={STUDIO_DRAFT_TEMPLATE_BIAS_MAX}
                              defaultValue={row.bias_body}
                              className={biasTextareaClassName}
                            />
                            <p className="text-[10px] text-text-tertiary tabular-nums">
                              {t("draftTemplateManageBiasCharLimit", {
                                max: STUDIO_DRAFT_TEMPLATE_BIAS_MAX,
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 border-t border-border-subtle/80 pt-4 dark:border-border-subtle">
                        <Button type="submit" size="sm" isLoading={updatePending}>
                          {t("draftTemplateManageSave")}
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => setEditingId(null)}
                        >
                          {t("draftTemplateManageCancel")}
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {row.name}
                        </p>
                        <p className="text-[11px] text-text-tertiary line-clamp-3 mt-0.5">
                          {row.bias_body.trim().replace(/\s+/g, " ")}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => setEditingId(row.id)}
                        >
                          {t("draftTemplateManageEdit")}
                        </Button>
                        <form action={deleteAction}>
                          <input type="hidden" name="template_id" value={row.id} />
                          <Button
                            type="submit"
                            variant="tertiary"
                            size="sm"
                            isLoading={deletePending}
                            onClick={(e) => {
                              if (!window.confirm(t("draftTemplateManageDeleteConfirm"))) {
                                e.preventDefault();
                              }
                            }}
                          >
                            {t("draftTemplateManageDelete")}
                          </Button>
                        </form>
                      </div>
                    </div>
                  )}
                </li>
                );
              })
            )}
          </ul>
        </div>

        <div className="shrink-0 border-t border-border-subtle px-5 py-4 dark:border-border-subtle">
          {editingId ? (
            <p className="rounded-lg border border-dashed border-border-subtle bg-layer-02/40 px-3 py-3 text-center text-[11px] leading-relaxed text-text-tertiary dark:border-border-subtle">
              {t("draftTemplateManageAddPausedHint")}
            </p>
          ) : (
            <>
              <p className="text-xs font-medium text-text-secondary mb-2">
                {t("draftTemplateManageAddTitle")}
              </p>
              <form action={createAction} className="space-y-3">
                <input
                  name="name"
                  required
                  maxLength={STUDIO_DRAFT_TEMPLATE_NAME_MAX}
                  placeholder={t("draftTemplateManageNamePlaceholder")}
                  className={nameInputClassName}
                />
                <div className={biasFieldSectionClassName}>
                  <p className="text-[11px] text-text-tertiary leading-relaxed">
                    {t("draftTemplateManageBiasHint")}
                  </p>
                  <textarea
                    name="bias_body"
                    required
                    rows={14}
                    maxLength={STUDIO_DRAFT_TEMPLATE_BIAS_MAX}
                    placeholder={t("draftTemplateManageBiasPlaceholder")}
                    className={biasTextareaClassName}
                  />
                  <p className="text-[10px] text-text-tertiary tabular-nums">
                    {t("draftTemplateManageBiasCharLimit", {
                      max: STUDIO_DRAFT_TEMPLATE_BIAS_MAX,
                    })}
                  </p>
                </div>
                <Button type="submit" size="sm" isLoading={createPending}>
                  {t("draftTemplateManageAddSubmit")}
                </Button>
              </form>
            </>
          )}
        </div>

        <div className="flex justify-end border-t border-border-subtle px-5 py-3 dark:border-border-subtle">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => dialogRef.current?.close()}
          >
            {t("draftTemplateManageClose")}
          </Button>
        </div>
      </div>
    </dialog>
  );

  return (
    <>
      <Button
        type="button"
        variant="tertiary"
        size="sm"
        className="shrink-0"
        onClick={() => dialogRef.current?.showModal()}
      >
        {t("draftTemplateManageCta")}
      </Button>
      {mounted ? createPortal(dialog, document.body) : null}
    </>
  );
}
