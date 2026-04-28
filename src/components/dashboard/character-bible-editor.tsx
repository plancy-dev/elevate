"use client";

/**
 * Character Bible editor — hybrid schema editor (ADR-009 §5) for the project
 * edit form. Stateful on the client so extras can be added/removed; the parent
 * form submits all `bible_*` fields together via a single server action.
 *
 * The Master Reference Image uploader is a separate server-action form because
 * it handles multipart/form-data.
 */

import { useActionState, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Plus, Trash2, Upload } from "lucide-react";
import {
  deleteStudioProjectReferenceImage,
  uploadStudioProjectReferenceImage,
  type StudioProjectActionState,
} from "@/actions/studio-projects";
import type { CharacterBible } from "@/lib/studio-productions/character-bible";
import { STUDIO_PROVIDER_DOCS } from "@/lib/studio-integrations/provider-docs";
import { translateActionErrorMessage } from "@/lib/i18n/translate-action-error";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/ui/app-toast";

type ExtraRow = { id: string; key: string; value: string };

function useExtras(
  initial: CharacterBible["extras"],
): [ExtraRow[], (rows: ExtraRow[]) => void] {
  const [rows, setRows] = useState<ExtraRow[]>(() => {
    const entries = Object.entries(initial ?? {});
    return entries.map(([k, v], i) => ({ id: `${i}-${k}`, key: k, value: v }));
  });
  return [rows, setRows];
}

export function CharacterBibleFields({ initial }: { initial: CharacterBible }) {
  const t = useTranslations("Dashboard.productions");
  const [extras, setExtras] = useExtras(initial.extras);

  const addExtra = () =>
    setExtras([
      ...extras,
      { id: `${Date.now()}-${extras.length}`, key: "", value: "" },
    ]);

  const removeExtra = (id: string) =>
    setExtras(extras.filter((r) => r.id !== id));

  const updateExtra = (id: string, patch: Partial<ExtraRow>) =>
    setExtras(extras.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  return (
    <fieldset className="space-y-4 rounded-[var(--radius-1)] border border-ink-100 bg-paper-50/40 p-4">
      <legend className="px-1 text-sm font-semibold text-ink-900">
        {t("characterBibleTitle")}
      </legend>
      <p className="text-[11px] leading-snug text-ink-500">
        {t("characterBibleIntro")}
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field
          label={t("characterBibleFieldName")}
          name="bible_name"
          defaultValue={initial.name ?? ""}
          placeholder={t("characterBibleFieldNamePlaceholder")}
        />
        <Field
          label={t("characterBibleFieldAge")}
          name="bible_age"
          defaultValue={
            initial.age != null ? String(initial.age) : ""
          }
          placeholder={t("characterBibleFieldAgePlaceholder")}
        />
        <Field
          label={t("characterBibleFieldEthnicity")}
          name="bible_ethnicity"
          defaultValue={initial.appearance?.ethnicity ?? ""}
          placeholder={t("characterBibleFieldEthnicityPlaceholder")}
        />
        <Field
          label={t("characterBibleFieldHair")}
          name="bible_hair"
          defaultValue={initial.appearance?.hair ?? ""}
          placeholder={t("characterBibleFieldHairPlaceholder")}
        />
        <Field
          label={t("characterBibleFieldEyes")}
          name="bible_eyes"
          defaultValue={initial.appearance?.eyes ?? ""}
          placeholder={t("characterBibleFieldEyesPlaceholder")}
        />
        <Field
          label={t("characterBibleFieldSkin")}
          name="bible_skin"
          defaultValue={initial.appearance?.skin ?? ""}
          placeholder={t("characterBibleFieldSkinPlaceholder")}
        />
        <Field
          label={t("characterBibleFieldWardrobe")}
          name="bible_wardrobe"
          defaultValue={initial.wardrobe ?? ""}
          placeholder={t("characterBibleFieldWardrobePlaceholder")}
        />
        <Field
          label={t("characterBibleFieldStyle")}
          name="bible_style"
          defaultValue={initial.style ?? ""}
          placeholder={t("characterBibleFieldStylePlaceholder")}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field
          label={t("characterBibleColorPrimary")}
          name="bible_color_primary"
          defaultValue={initial.color_palette?.primary ?? ""}
          placeholder="#1a2b3c"
        />
        <Field
          label={t("characterBibleColorSecondary")}
          name="bible_color_secondary"
          defaultValue={initial.color_palette?.secondary ?? ""}
          placeholder="#aabbcc"
        />
        <Field
          label={t("characterBibleColorAccent")}
          name="bible_color_accent"
          defaultValue={initial.color_palette?.accent ?? ""}
          placeholder="#ff6a00"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-ink-700">
            {t("characterBibleExtrasTitle")}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addExtra}
            className="inline-flex items-center gap-1"
          >
            <Plus className="h-3 w-3" aria-hidden />
            {t("characterBibleExtrasAdd")}
          </Button>
        </div>
        {extras.length === 0 ? (
          <p className="text-[11px] leading-snug text-ink-500">
            {t("characterBibleExtrasEmpty")}
          </p>
        ) : (
          <div className="space-y-2">
            {extras.map((row) => (
              <div key={row.id} className="flex items-center gap-2">
                <input
                  name="bible_extras_key[]"
                  value={row.key}
                  onChange={(e) =>
                    updateExtra(row.id, { key: e.target.value })
                  }
                  placeholder={t("characterBibleExtrasKeyPlaceholder")}
                  className="h-9 w-1/3 rounded-[var(--radius-1)] border border-ink-100 bg-paper-0 px-2 text-sm"
                />
                <input
                  name="bible_extras_value[]"
                  value={row.value}
                  onChange={(e) =>
                    updateExtra(row.id, { value: e.target.value })
                  }
                  placeholder={t("characterBibleExtrasValuePlaceholder")}
                  className="h-9 flex-1 rounded-[var(--radius-1)] border border-ink-100 bg-paper-0 px-2 text-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeExtra(row.id)}
                  aria-label={t("characterBibleExtrasRemove")}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </fieldset>
  );
}

function Field(props: {
  label: string;
  name: string;
  defaultValue: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium text-ink-700">
        {props.label}
      </span>
      <input
        name={props.name}
        defaultValue={props.defaultValue}
        placeholder={props.placeholder}
        maxLength={500}
        className="h-9 w-full rounded-[var(--radius-1)] border border-ink-100 bg-paper-0 px-2 text-sm"
      />
    </label>
  );
}

export function CharacterReferenceImageField({
  projectId,
  currentUrl,
}: {
  projectId: string;
  currentUrl: string | null;
}) {
  const t = useTranslations("Dashboard.productions");
  const tAction = useTranslations("Dashboard.actionErrors");
  const router = useRouter();
  const processed = useRef<StudioProjectActionState>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);

  const [uploadState, uploadAction, uploadPending] = useActionState(
    uploadStudioProjectReferenceImage,
    null,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteStudioProjectReferenceImage,
    null,
  );

  useEffect(() => {
    if (!uploadState || processed.current === uploadState) return;
    processed.current = uploadState;
    if (uploadState.ok) {
      toast.success(t("characterReferenceToastUploaded"));
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
      // Defer the controlled state reset out of the effect body to avoid
      // cascading renders (react-hooks/set-state-in-effect).
      queueMicrotask(() => setSelectedName(null));
    } else if (uploadState.error) {
      toast.error(translateActionErrorMessage(uploadState.error, tAction));
    }
  }, [uploadState, router, t, tAction]);

  useEffect(() => {
    if (!deleteState || processed.current === deleteState) return;
    processed.current = deleteState;
    if (deleteState.ok) {
      toast.success(t("characterReferenceToastDeleted"));
      router.refresh();
    } else if (deleteState.error) {
      toast.error(translateActionErrorMessage(deleteState.error, tAction));
    }
  }, [deleteState, router, t, tAction]);

  const geminiDocs = STUDIO_PROVIDER_DOCS.google_gemini.apiDocsUrl;

  return (
    <div className="space-y-3 rounded-[var(--radius-1)] border border-ink-100 bg-paper-50/40 p-4">
      <div>
        <p className="text-sm font-semibold text-ink-900">
          {t("characterReferenceTitle")}
        </p>
        <p className="mt-1 text-[11px] leading-snug text-ink-500">
          {t("characterReferenceIntro")}
        </p>
        <a
          href={geminiDocs}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-block text-[11px] font-medium text-vermilion-600 underline underline-offset-2 hover:opacity-90"
        >
          {t("characterReferenceGuideLink")}
        </a>
      </div>

      {currentUrl ? (
        <div className="flex items-start gap-3">
          <Image
            src={currentUrl}
            alt={t("characterReferencePreviewAlt")}
            width={96}
            height={96}
            unoptimized
            className="h-24 w-24 rounded-[var(--radius-1)] border border-ink-100 object-cover"
          />
          <form action={deleteAction} className="flex flex-col gap-2">
            <input type="hidden" name="project_id" value={projectId} />
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              isLoading={deletePending}
              onClick={(e) => {
                if (!window.confirm(t("characterReferenceDeleteConfirm"))) {
                  e.preventDefault();
                }
              }}
            >
              {t("characterReferenceDelete")}
            </Button>
          </form>
        </div>
      ) : (
        <p className="text-[11px] text-ink-500">
          {t("characterReferenceEmpty")}
        </p>
      )}

      <form action={uploadAction} className="space-y-2">
        <input type="hidden" name="project_id" value={projectId} />
        <label className="block">
          <span className="mb-1 block text-[11px] font-medium text-ink-700">
            {t("characterReferenceUploadLabel")}
          </span>
          <input
            ref={fileRef}
            type="file"
            name="reference_image"
            accept="image/png,image/jpeg,image/webp,image/gif"
            required
            onChange={(e) => setSelectedName(e.target.files?.[0]?.name ?? null)}
            className="block w-full text-xs file:mr-3 file:rounded-[var(--radius-1)] file:border file:border-ink-100 file:bg-paper-0 file:px-2 file:py-1 file:text-xs file:font-medium file:text-ink-900"
          />
        </label>
        {selectedName ? (
          <p className="text-[11px] text-ink-500">{selectedName}</p>
        ) : null}
        <Button
          type="submit"
          variant="primary"
          size="sm"
          isLoading={uploadPending}
          className="inline-flex items-center gap-1.5"
        >
          <Upload className="h-3 w-3" aria-hidden />
          {t("characterReferenceUploadSubmit")}
        </Button>
        <p className="text-[11px] leading-snug text-ink-500">
          {t("characterReferenceUploadHint")}
        </p>
      </form>
    </div>
  );
}
