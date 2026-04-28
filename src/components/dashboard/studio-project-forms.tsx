"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  createStudioProject,
  deleteStudioProject,
  updateStudioProject,
  type StudioProjectActionState,
} from "@/actions/studio-projects";
import type { StudioProjectRow } from "@/lib/data/studio-projects";
import { translateActionErrorMessage } from "@/lib/i18n/translate-action-error";
import {
  BRAND_GUIDE_PRESET_IDS,
  BRAND_GUIDE_PRESET_SNIPPETS,
  type BrandGuidePresetId,
} from "@/lib/studio-productions/brand-guide-presets";
import { parseCharacterBible } from "@/lib/studio-productions/character-bible";
import {
  CharacterBibleFields,
  CharacterReferenceImageField,
} from "@/components/dashboard/character-bible-editor";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/ui/app-toast";
import { cn } from "@/lib/utils";

export function StudioProjectCreateForm() {
  const t = useTranslations("Dashboard.productions");
  const router = useRouter();
  const processedRef = useRef<StudioProjectActionState>(null);
  const [brandGuide, setBrandGuide] = useState("");

  const [state, action, pending] = useActionState(createStudioProject, null);

  useEffect(() => {
    if (!state || processedRef.current === state) return;
    processedRef.current = state;
    if (state.ok) {
      toast.success(t("projectsToastCreated"));
      router.refresh();
    } else if (state.error) {
      toast.error(translateActionErrorMessage(state.error, t));
    }
  }, [state, router, t]);

  const appendPreset = (id: BrandGuidePresetId) => {
    const snippet = BRAND_GUIDE_PRESET_SNIPPETS[id];
    setBrandGuide((prev) => {
      const next = prev.trim();
      if (!next) return snippet;
      return `${next}\n\n${snippet}`;
    });
  };

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-ink-700 mb-1.5" htmlFor="proj_name">
          {t("projectsFormName")}
        </label>
        <input
          id="proj_name"
          name="name"
          required
          maxLength={200}
          placeholder={t("projectsFormNamePlaceholder")}
          className="h-10 w-full rounded-[var(--radius-1)] border border-ink-100 bg-paper-0 px-3 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-ink-700 mb-1.5" htmlFor="proj_desc">
          {t("projectsFormDescription")}
        </label>
        <input
          id="proj_desc"
          name="description"
          maxLength={500}
          placeholder={t("projectsFormDescriptionPlaceholder")}
          className="h-10 w-full rounded-[var(--radius-1)] border border-ink-100 bg-paper-0 px-3 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-ink-700 mb-1.5" htmlFor="proj_guide">
          {t("projectsFormBrandGuide")}
        </label>
        <p className="mb-2 text-[11px] font-medium text-ink-500">{t("projectsFormTonePresetsLabel")}</p>
        <div className="mb-3 flex flex-wrap gap-2">
          {BRAND_GUIDE_PRESET_IDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => appendPreset(id)}
              className={cn(
                "rounded-[var(--radius-1)] border border-ink-100 bg-paper-50/80 px-2.5 py-1 text-[11px] font-medium",
                "text-ink-700 transition-colors hover:border-primary/30 hover:bg-paper-50 hover:text-ink-900",
              )}
            >
              {t(`projectsFormToneChip.${id}`)}
            </button>
          ))}
        </div>
        <textarea
          id="proj_guide"
          name="brand_guide"
          rows={5}
          maxLength={8000}
          value={brandGuide}
          onChange={(e) => setBrandGuide(e.target.value)}
          placeholder={t("projectsFormBrandGuidePlaceholder")}
          className="w-full rounded-[var(--radius-1)] border border-ink-100 bg-paper-0 px-3 py-2 text-sm"
        />
        <p className="mt-1.5 text-[11px] text-ink-500 leading-snug">
          {t("projectsFormBrandGuideHint")}
        </p>
      </div>
      <Button type="submit" variant="primary" size="sm" isLoading={pending}>
        {t("projectsFormSubmitCreate")}
      </Button>
    </form>
  );
}

export function StudioProjectEditForm({ project }: { project: StudioProjectRow }) {
  const t = useTranslations("Dashboard.productions");
  const tAction = useTranslations("Dashboard.actionErrors");
  const router = useRouter();
  const processedRef = useRef<StudioProjectActionState>(null);
  const [brandGuide, setBrandGuide] = useState(project.brand_guide ?? "");
  const bible = parseCharacterBible(project.character_bible);

  const [state, action, pending] = useActionState(updateStudioProject, null);

  useEffect(() => {
    if (!state || processedRef.current === state) return;
    processedRef.current = state;
    if (state.ok) {
      toast.success(t("projectsToastUpdated"));
      router.refresh();
    } else if (state.error) {
      toast.error(translateActionErrorMessage(state.error, tAction));
    }
  }, [state, router, t, tAction]);

  const appendPreset = (id: BrandGuidePresetId) => {
    const snippet = BRAND_GUIDE_PRESET_SNIPPETS[id];
    setBrandGuide((prev) => {
      const next = prev.trim();
      if (!next) return snippet;
      return `${next}\n\n${snippet}`;
    });
  };

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="project_id" value={project.id} />
      <div>
        <label className="mb-1.5 block text-xs font-medium text-ink-700" htmlFor="edit_proj_name">
          {t("projectsFormName")}
        </label>
        <input
          id="edit_proj_name"
          name="name"
          required
          maxLength={200}
          defaultValue={project.name}
          placeholder={t("projectsFormNamePlaceholder")}
          className="h-10 w-full rounded-[var(--radius-1)] border border-ink-100 bg-paper-0 px-3 text-sm"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-ink-700" htmlFor="edit_proj_desc">
          {t("projectsFormDescription")}
        </label>
        <input
          id="edit_proj_desc"
          name="description"
          maxLength={500}
          defaultValue={project.description ?? ""}
          placeholder={t("projectsFormDescriptionPlaceholder")}
          className="h-10 w-full rounded-[var(--radius-1)] border border-ink-100 bg-paper-0 px-3 text-sm"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-ink-700" htmlFor="edit_proj_guide">
          {t("projectsFormBrandGuide")}
        </label>
        <p className="mb-2 text-[11px] font-medium text-ink-500">{t("projectsFormTonePresetsLabel")}</p>
        <div className="mb-3 flex flex-wrap gap-2">
          {BRAND_GUIDE_PRESET_IDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => appendPreset(id)}
              className={cn(
                "rounded-[var(--radius-1)] border border-ink-100 bg-paper-50/80 px-2.5 py-1 text-[11px] font-medium",
                "text-ink-700 transition-colors hover:border-primary/30 hover:bg-paper-50 hover:text-ink-900",
              )}
            >
              {t(`projectsFormToneChip.${id}`)}
            </button>
          ))}
        </div>
        <textarea
          id="edit_proj_guide"
          name="brand_guide"
          rows={5}
          maxLength={8000}
          value={brandGuide}
          onChange={(e) => setBrandGuide(e.target.value)}
          placeholder={t("projectsFormBrandGuidePlaceholder")}
          className="w-full rounded-[var(--radius-1)] border border-ink-100 bg-paper-0 px-3 py-2 text-sm"
        />
        <p className="mt-1.5 text-[11px] leading-snug text-ink-500">{t("projectsFormBrandGuideHint")}</p>
      </div>

      <CharacterBibleFields initial={bible} />

      <Button type="submit" variant="primary" size="sm" isLoading={pending}>
        {t("projectsFormSubmitUpdate")}
      </Button>
    </form>
  );
}

export function StudioProjectEditFormWithDelete({ project }: { project: StudioProjectRow }) {
  return (
    <div className="space-y-6">
      <StudioProjectEditForm key={project.id} project={project} />
      <CharacterReferenceImageField
        projectId={project.id}
        currentUrl={project.character_reference_image_url}
      />
      <div className="border-t border-ink-100 pt-4">
        <StudioProjectDeleteButton projectId={project.id} />
      </div>
    </div>
  );
}

export function StudioProjectDeleteButton({
  projectId,
}: {
  projectId: string;
}) {
  const t = useTranslations("Dashboard.productions");
  const router = useRouter();
  const processedRef = useRef<StudioProjectActionState>(null);

  const [state, action, pending] = useActionState(deleteStudioProject, null);

  useEffect(() => {
    if (!state || processedRef.current === state) return;
    processedRef.current = state;
    if (state.ok) {
      toast.success(t("projectsToastDeleted"));
      router.refresh();
    } else if (state.error) {
      toast.error(translateActionErrorMessage(state.error, t));
    }
  }, [state, router, t]);

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(t("projectsDeleteConfirm"))) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="project_id" value={projectId} />
      <Button type="submit" variant="danger" size="sm" isLoading={pending}>
        {t("projectsDeleteCta")}
      </Button>
    </form>
  );
}
