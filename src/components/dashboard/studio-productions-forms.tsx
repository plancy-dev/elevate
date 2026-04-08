"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import {
  createStudioArtifact,
  createStudioEpisode,
  deleteStudioArtifact,
  deleteStudioEpisode,
  updateStudioArtifact,
  updateStudioEpisode,
  type StudioProductionActionState,
} from "@/actions/studio-productions";
import { translateActionErrorMessage } from "@/lib/i18n/translate-action-error";
import type {
  StudioProductionArtifactRow,
  StudioProductionEpisodeRow,
} from "@/lib/data/studio-productions";
import {
  STUDIO_EPISODE_STATUSES,
  type StudioEpisodeStatus,
} from "@/lib/studio-productions/constants";
import type { Json } from "@/types/database.types";
import { Clapperboard } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { FieldSelect } from "@/components/ui/field-select";
import { StudioEpisodeDistributionFields } from "@/components/dashboard/studio-episode-distribution-fields";

function metadataToFormString(metadata: Json | null): string {
  if (metadata == null) return "";
  if (typeof metadata === "object" && !Array.isArray(metadata)) {
    const o = metadata as Record<string, unknown>;
    if (Object.keys(o).length === 0) return "";
  }
  try {
    return JSON.stringify(metadata, null, 2);
  } catch {
    return "";
  }
}

const initialState: StudioProductionActionState = undefined;

const EPISODE_STATUS_I18N: Record<
  StudioEpisodeStatus,
  | "statusDraft"
  | "statusReady"
  | "statusPublished"
  | "statusArchived"
> = {
  draft: "statusDraft",
  ready: "statusReady",
  published: "statusPublished",
  archived: "statusArchived",
};

export function StudioProductionsNewForm({
  initialNotes = "",
}: {
  /** From Prompt Studio → Productions sessionStorage handoff */
  initialNotes?: string;
}) {
  const t = useTranslations("Dashboard.productions");
  const tAction = useTranslations("Dashboard.actionErrors");
  const [state, formAction, pending] = useActionState(
    createStudioEpisode,
    initialState,
  );

  const statusOptions = STUDIO_EPISODE_STATUSES.map((s) => ({
    value: s,
    label: t(EPISODE_STATUS_I18N[s]),
  }));

  return (
    <form action={formAction} className="space-y-6 max-w-2xl">
      {state?.error ? (
        <p className="rounded-sm border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
          {translateActionErrorMessage(state.error, tAction)}
        </p>
      ) : null}
      <div className="rounded-2xl border border-border-subtle/90 bg-gradient-to-br from-layer-01 via-layer-02/40 to-layer-01 p-6 shadow-sm">
        <div className="space-y-4">
          <div>
            <label
              htmlFor="new_title"
              className="block text-xs font-medium text-text-secondary mb-1.5"
            >
              {t("titleLabel")}
            </label>
            <input
              id="new_title"
              name="title"
              required
              maxLength={500}
              placeholder={t("titlePlaceholder")}
              className="h-10 w-full rounded-sm border border-border-subtle bg-field px-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-focus focus:outline-none focus:ring-2 focus:ring-focus/25"
            />
          </div>
          <div>
            <label
              htmlFor="new_status"
              className="block text-xs font-medium text-text-secondary mb-1.5"
            >
              {t("statusLabel")}
            </label>
            <FieldSelect
              id="new_status"
              name="status"
              defaultValue="draft"
              options={statusOptions}
            />
          </div>
        </div>
      </div>

      <StudioEpisodeDistributionFields
        idPrefix="new"
        distributionStored=""
        publishUrl=""
      />

      <div>
        <label
          htmlFor="new_notes"
          className="block text-xs font-medium text-text-secondary mb-1.5"
        >
          {t("notesLabel")}
        </label>
        <textarea
          id="new_notes"
          name="notes"
          rows={5}
          defaultValue={initialNotes}
          placeholder={t("notesPlaceholder")}
          className="w-full min-h-[120px] rounded-xl border border-border-subtle bg-field px-3 py-3 text-sm leading-relaxed text-text-primary placeholder:text-text-tertiary focus:border-focus focus:outline-none focus:ring-2 focus:ring-focus/25"
        />
      </div>
      <div className="flex flex-wrap gap-3 pt-2">
        <Button variant="primary" type="submit" isLoading={pending}>
          {t("submitCreate")}
        </Button>
        <ButtonLink href="/dashboard/productions" variant="secondary">
          {t("cancelNew")}
        </ButtonLink>
      </div>
    </form>
  );
}

export function StudioProductionsEpisodeEditForm({
  episode,
}: {
  episode: StudioProductionEpisodeRow;
}) {
  const t = useTranslations("Dashboard.productions");
  const tAction = useTranslations("Dashboard.actionErrors");
  const [state, formAction, pending] = useActionState(
    updateStudioEpisode,
    initialState,
  );

  const statusOptions = STUDIO_EPISODE_STATUSES.map((s) => ({
    value: s,
    label: t(EPISODE_STATUS_I18N[s]),
  }));

  return (
    <form action={formAction} className="space-y-6 max-w-2xl">
      <input type="hidden" name="episode_id" value={episode.id} />
      {state?.error ? (
        <p className="rounded-sm border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
          {translateActionErrorMessage(state.error, tAction)}
        </p>
      ) : null}
      <div className="rounded-2xl border border-border-subtle/90 bg-gradient-to-br from-layer-01 via-layer-02/40 to-layer-01 p-6 shadow-sm">
        <div className="space-y-4">
          <div>
            <label
              htmlFor="edit_title"
              className="block text-xs font-medium text-text-secondary mb-1.5"
            >
              {t("titleLabel")}
            </label>
            <input
              id="edit_title"
              name="title"
              required
              defaultValue={episode.title}
              maxLength={500}
              className="h-10 w-full rounded-sm border border-border-subtle bg-field px-3 text-sm text-text-primary focus:border-focus focus:outline-none focus:ring-2 focus:ring-focus/25"
            />
          </div>
          <div>
            <label
              htmlFor="edit_status"
              className="block text-xs font-medium text-text-secondary mb-1.5"
            >
              {t("statusLabel")}
            </label>
            <FieldSelect
              id="edit_status"
              name="status"
              defaultValue={episode.status}
              options={statusOptions}
            />
          </div>
        </div>
      </div>

      <StudioEpisodeDistributionFields
        key={`${episode.id}-${episode.updated_at}-${episode.distribution_label}`}
        idPrefix="edit"
        distributionStored={episode.distribution_label}
        publishUrl={episode.publish_url ?? ""}
      />

      <div>
        <label
          htmlFor="edit_notes"
          className="block text-xs font-medium text-text-secondary mb-1.5"
        >
          {t("notesLabel")}
        </label>
        <textarea
          id="edit_notes"
          name="notes"
          rows={6}
          defaultValue={episode.notes}
          className="w-full min-h-[140px] rounded-xl border border-border-subtle bg-field px-3 py-3 text-sm leading-relaxed text-text-primary focus:border-focus focus:outline-none focus:ring-2 focus:ring-focus/25"
        />
      </div>
      <Button variant="primary" type="submit" isLoading={pending}>
        {t("saveEpisode")}
      </Button>
    </form>
  );
}

export function StudioProductionsDeleteEpisodeForm({
  episodeId,
}: {
  episodeId: string;
}) {
  const t = useTranslations("Dashboard.productions");
  const tAction = useTranslations("Dashboard.actionErrors");
  const [state, formAction, pending] = useActionState(
    deleteStudioEpisode,
    initialState,
  );

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="episode_id" value={episodeId} />
      {state?.error ? (
        <p className="mb-2 rounded-sm border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
          {translateActionErrorMessage(state.error, tAction)}
        </p>
      ) : null}
      <Button
        variant="danger"
        type="submit"
        isLoading={pending}
        onClick={(e) => {
          if (!window.confirm(t("deleteEpisodeConfirm"))) {
            e.preventDefault();
          }
        }}
      >
        {t("deleteEpisode")}
      </Button>
    </form>
  );
}

function ArtifactAddForm({
  episodeId,
  prefill,
}: {
  episodeId: string;
  prefill?: {
    contentText: string;
    artifact_role: string;
    tool_platform: string;
  } | null;
}) {
  const t = useTranslations("Dashboard.productions");
  const tAction = useTranslations("Dashboard.actionErrors");
  const [state, formAction, pending] = useActionState(
    createStudioArtifact,
    initialState,
  );

  const formKey = prefill
    ? `pf-${prefill.artifact_role}-${prefill.contentText.length}`
    : "no-pf";

  return (
    <form
      key={formKey}
      action={formAction}
      className="rounded-xl border border-border-subtle/90 bg-gradient-to-b from-layer-02/80 to-layer-01 p-4 space-y-3 shadow-sm dark:border-white/10 dark:from-[#121820]/90 dark:to-[#0a0f14]"
    >
      <input type="hidden" name="episode_id" value={episodeId} />
      <p className="text-sm font-medium text-text-primary">{t("artifactAdd")}</p>
      {state?.error ? (
        <p className="rounded-sm border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
          {translateActionErrorMessage(state.error, tAction)}
        </p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs text-text-secondary mb-1">
            {t("artifactRoleLabel")}
          </label>
          <input
            name="artifact_role"
            required
            defaultValue={prefill?.artifact_role ?? ""}
            placeholder={t("artifactRolePlaceholder")}
            className="h-9 w-full bg-field border border-border-subtle px-2 text-sm text-text-primary focus:outline-none focus:border-focus"
          />
        </div>
        <div>
          <label className="block text-xs text-text-secondary mb-1">
            {t("artifactPlatformLabel")}
          </label>
          <input
            name="tool_platform"
            required
            defaultValue={prefill?.tool_platform ?? ""}
            placeholder={t("artifactPlatformPlaceholder")}
            className="h-9 w-full bg-field border border-border-subtle px-2 text-sm text-text-primary focus:outline-none focus:border-focus"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs text-text-secondary mb-1">
          {t("artifactContentLabel")}
        </label>
        <textarea
          name="content_text"
          rows={3}
          defaultValue={prefill?.contentText ?? ""}
          className="w-full bg-field border border-border-subtle px-2 py-2 text-sm text-text-primary focus:outline-none focus:border-focus"
        />
      </div>
      <div>
        <label className="block text-xs text-text-secondary mb-1">
          {t("artifactExternalUrlLabel")}
        </label>
        <input
          name="external_url"
          type="url"
          inputMode="url"
          placeholder="https://"
          className="h-9 w-full bg-field border border-border-subtle px-2 text-sm text-text-primary focus:outline-none focus:border-focus"
        />
      </div>
      <div>
        <label className="block text-xs text-text-secondary mb-1">
          {t("artifactMetadataLabel")}
        </label>
        <textarea
          name="metadata_json"
          rows={2}
          placeholder="{}"
          className="w-full font-mono text-xs bg-field border border-border-subtle px-2 py-2 text-text-primary focus:outline-none focus:border-focus"
        />
        <p className="mt-1 text-xs text-text-tertiary">
          {t("artifactMetadataHint")}
        </p>
      </div>
      <Button variant="secondary" type="submit" size="sm" isLoading={pending}>
        {t("artifactCreate")}
      </Button>
    </form>
  );
}

function ArtifactEditForm({
  episodeId,
  artifact,
}: {
  episodeId: string;
  artifact: StudioProductionArtifactRow;
}) {
  const t = useTranslations("Dashboard.productions");
  const tAction = useTranslations("Dashboard.actionErrors");
  const [state, formAction, pending] = useActionState(
    updateStudioArtifact,
    initialState,
  );
  /** Stable id so the save button can live outside the <form> (avoids nested forms with delete). */
  const editFormId = `studio-artifact-edit-${artifact.id}`;

  return (
    <div
      className="film-strip-frame flex h-[min(70vh,380px)] w-[min(100%,272px)] shrink-0 flex-col overflow-hidden rounded-lg border border-border-subtle bg-layer-01/95 shadow-sm transition-shadow hover:border-primary/25 hover:shadow-md dark:border-white/12 dark:bg-[rgba(8,12,20,0.92)] dark:hover:border-primary/35"
    >
      <form
        id={editFormId}
        action={formAction}
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
      <input type="hidden" name="episode_id" value={episodeId} />
      <input type="hidden" name="artifact_id" value={artifact.id} />
      <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto overscroll-contain px-3 pb-2 pt-3">
        {state?.error ? (
          <p className="rounded-sm border border-danger/40 bg-danger/10 px-2 py-1.5 text-[11px] text-danger">
            {translateActionErrorMessage(state.error, tAction)}
          </p>
        ) : null}
        <div className="grid grid-cols-1 gap-2">
          <div>
            <label className="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-text-tertiary">
              {t("artifactRoleLabel")}
            </label>
            <input
              name="artifact_role"
              required
              defaultValue={artifact.artifact_role}
              className="h-8 w-full rounded-sm border border-border-subtle bg-field px-2 text-xs text-text-primary focus:border-focus focus:outline-none focus:ring-1 focus:ring-focus/30 dark:border-white/10"
            />
          </div>
          <div>
            <label className="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-text-tertiary">
              {t("artifactPlatformLabel")}
            </label>
            <input
              name="tool_platform"
              required
              defaultValue={artifact.tool_platform}
              className="h-8 w-full rounded-sm border border-border-subtle bg-field px-2 text-xs text-text-primary focus:border-focus focus:outline-none focus:ring-1 focus:ring-focus/30 dark:border-white/10"
            />
          </div>
        </div>
        <div>
          <label className="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-text-tertiary">
            {t("artifactContentLabel")}
          </label>
          <textarea
            name="content_text"
            rows={3}
            defaultValue={artifact.content_text}
            className="w-full resize-none rounded-sm border border-border-subtle bg-field px-2 py-1.5 text-xs leading-relaxed text-text-primary focus:border-focus focus:outline-none focus:ring-1 focus:ring-focus/30 dark:border-white/10"
          />
        </div>
        <div>
          <label className="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-text-tertiary">
            {t("artifactExternalUrlLabel")}
          </label>
          <input
            name="external_url"
            type="url"
            inputMode="url"
            defaultValue={artifact.external_url ?? ""}
            placeholder="https://"
            className="h-8 w-full rounded-sm border border-border-subtle bg-field px-2 text-xs text-text-primary focus:border-focus focus:outline-none focus:ring-1 focus:ring-focus/30 dark:border-white/10"
          />
        </div>
        <div>
          <label className="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-text-tertiary">
            {t("artifactMetadataLabel")}
          </label>
          <textarea
            name="metadata_json"
            rows={2}
            defaultValue={metadataToFormString(artifact.metadata)}
            className="w-full resize-none rounded-sm border border-border-subtle bg-field px-2 py-1.5 font-mono text-[11px] leading-snug text-text-primary focus:border-focus focus:outline-none focus:ring-1 focus:ring-focus/30 dark:border-white/10"
          />
          <p className="mt-0.5 text-[10px] leading-snug text-text-tertiary">
            {t("artifactMetadataHint")}
          </p>
        </div>
      </div>
      </form>
      <div className="flex shrink-0 flex-wrap gap-2 border-t border-border-subtle/80 bg-layer-02/50 px-3 py-2.5 dark:border-white/10 dark:bg-black/25">
        <Button
          variant="primary"
          type="submit"
          form={editFormId}
          size="sm"
          isLoading={pending}
        >
          {t("artifactSave")}
        </Button>
        <ArtifactDeleteForm episodeId={episodeId} artifactId={artifact.id} />
      </div>
    </div>
  );
}

function ArtifactDeleteForm({
  episodeId,
  artifactId,
}: {
  episodeId: string;
  artifactId: string;
}) {
  const t = useTranslations("Dashboard.productions");
  const tAction = useTranslations("Dashboard.actionErrors");
  const [state, formAction, pending] = useActionState(
    deleteStudioArtifact,
    initialState,
  );

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="episode_id" value={episodeId} />
      <input type="hidden" name="artifact_id" value={artifactId} />
      {state?.error ? (
        <p className="mb-1 text-xs text-danger">
          {translateActionErrorMessage(state.error, tAction)}
        </p>
      ) : null}
      <Button variant="tertiary" type="submit" size="sm" isLoading={pending}>
        {t("artifactDelete")}
      </Button>
    </form>
  );
}

export function StudioProductionsArtifactsSection({
  episodeId,
  artifacts,
  artifactAddPrefill,
}: {
  episodeId: string;
  artifacts: StudioProductionArtifactRow[];
  /** Prompt Studio handoff — prefills the add-artifact form once */
  artifactAddPrefill?: {
    contentText: string;
    artifact_role: string;
    tool_platform: string;
  } | null;
}) {
  const t = useTranslations("Dashboard.productions");

  return (
    <section
      id="production-artifacts-anchor"
      className="space-y-6 mt-6 border-t border-border-subtle pt-10 scroll-mt-24"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Clapperboard
              className="h-5 w-5 text-primary shrink-0"
              aria-hidden
            />
            <h2 className="text-lg font-semibold tracking-tight text-text-primary">
              {t("artifactsHeading")}
            </h2>
          </div>
          <p className="text-sm text-text-tertiary max-w-prose leading-relaxed">
            {t("artifactsDeckSubtitle")}
          </p>
        </div>
      </div>
      <ArtifactAddForm episodeId={episodeId} prefill={artifactAddPrefill} />
      {artifacts.length > 0 ? (
        <div className="rounded-lg bg-zinc-950/[0.03] px-1.5 py-2 ring-1 ring-zinc-950/10 dark:bg-black/35 dark:ring-white/10">
          <ul
            className="flex min-h-[200px] gap-2 overflow-x-auto overscroll-x-contain touch-pan-x scroll-pl-3 px-1 pb-2 pt-1 [scrollbar-width:thin] snap-x snap-mandatory [-webkit-overflow-scrolling:touch]"
            aria-label={t("artifactsHeading")}
          >
            {artifacts.map((a) => (
              <li key={a.id} className="snap-start">
                <ArtifactEditForm episodeId={episodeId} artifact={a} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
