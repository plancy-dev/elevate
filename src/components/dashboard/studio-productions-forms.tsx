"use client";

import {
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
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
  StudioProductionEpisodeRowWithEmbeds,
} from "@/lib/data/studio-productions";
import {
  STUDIO_ARTIFACT_ROLE_DATALIST_ID,
  STUDIO_SUGGESTED_ARTIFACT_ROLES,
} from "@/lib/studio-productions/artifact-roles";
import {
  STUDIO_EPISODE_STATUSES,
  type StudioEpisodeStatus,
} from "@/lib/studio-productions/constants";
import type { StudioShortsCatalog } from "@/lib/studio-productions/shorts-catalog";
import type { Json } from "@/types/database.types";
import { StudioEpisodeShortsFields } from "@/components/dashboard/studio-episode-shorts-fields";

function ArtifactRoleDatalist() {
  return (
    <datalist id={STUDIO_ARTIFACT_ROLE_DATALIST_ID}>
      {STUDIO_SUGGESTED_ARTIFACT_ROLES.map((role) => (
        <option key={role} value={role} />
      ))}
    </datalist>
  );
}
import { Clapperboard, ExternalLink } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { FieldSelect } from "@/components/ui/field-select";
import { StudioEpisodeDistributionFields } from "@/components/dashboard/studio-episode-distribution-fields";
import {
  isYoutubeShortsDistributionLabel,
  parseStoredDistribution,
} from "@/lib/studio-productions/distribution";

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

function excerptArtifactText(text: string, max: number): string {
  const s = text.trim().replace(/\s+/g, " ");
  if (s.length <= max) return s;
  return `${s.slice(0, max)}…`;
}

function artifactLinkHostLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return excerptArtifactText(url, 56);
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
  catalog,
}: {
  /** From Prompt Studio → Productions sessionStorage handoff */
  initialNotes?: string;
  catalog: StudioShortsCatalog;
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

  const [distributionPreset, setDistributionPreset] = useState("");
  const showShortsPlan =
    isYoutubeShortsDistributionLabel(distributionPreset);

  return (
    <form action={formAction} className="space-y-6 max-w-2xl">
      {state?.error ? (
        <p className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
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
              className="h-10 w-full rounded-lg border border-border-subtle bg-field px-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-focus focus:outline-none focus:ring-2 focus:ring-focus/25"
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
        preset={distributionPreset}
        onPresetChange={setDistributionPreset}
      />

      {showShortsPlan ? (
        <StudioEpisodeShortsFields catalog={catalog} idPrefix="new" showTopicLine />
      ) : null}

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
  catalog,
}: {
  episode: StudioProductionEpisodeRowWithEmbeds;
  catalog: StudioShortsCatalog;
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

  const parsedDistribution = useMemo(
    () => parseStoredDistribution(episode.distribution_label),
    [episode.distribution_label],
  );
  const [distributionPreset, setDistributionPreset] = useState(
    parsedDistribution.preset,
  );
  const showShortsPlan =
    isYoutubeShortsDistributionLabel(distributionPreset);

  return (
    <form action={formAction} className="space-y-6 max-w-2xl">
      <input type="hidden" name="episode_id" value={episode.id} />
      {state?.error ? (
        <p className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
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
              className="h-10 w-full rounded-lg border border-border-subtle bg-field px-3 text-sm text-text-primary focus:border-focus focus:outline-none focus:ring-2 focus:ring-focus/25"
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
        preset={distributionPreset}
        onPresetChange={setDistributionPreset}
      />

      {showShortsPlan ? (
        <StudioEpisodeShortsFields
          key={`${episode.id}-${episode.updated_at}-${episode.studio_niche_id}-${episode.studio_format_template_id}-${episode.studio_distribution_channel_id}`}
          catalog={catalog}
          idPrefix="edit"
          initialNicheId={episode.studio_niche_id}
          initialTemplateId={episode.studio_format_template_id}
          initialChannelId={episode.studio_distribution_channel_id}
        />
      ) : null}

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
        <p className="mb-2 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
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
        <p className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
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
            list={STUDIO_ARTIFACT_ROLE_DATALIST_ID}
            autoComplete="off"
            defaultValue={prefill?.artifact_role ?? ""}
            placeholder={t("artifactRolePlaceholder")}
            className="h-9 w-full bg-field border border-border-subtle px-2 text-sm text-text-primary focus:outline-none focus:border-focus"
          />
          <p className="mt-1 text-xs text-text-tertiary leading-snug">
            {t("artifactRoleHint")}
          </p>
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

/** Full-width edit form in modal; `key={artifact.id}` on parent resets action state per row. */
function ArtifactEditDialogBody({
  episodeId,
  artifact,
  onSaved,
  onCancel,
}: {
  episodeId: string;
  artifact: StudioProductionArtifactRow;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations("Dashboard.productions");
  const tAction = useTranslations("Dashboard.actionErrors");
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    updateStudioArtifact,
    initialState,
  );
  const prevPendingRef = useRef(false);

  useEffect(() => {
    if (prevPendingRef.current && !pending && state === undefined) {
      router.refresh();
      onSaved();
    }
    prevPendingRef.current = pending;
  }, [onSaved, pending, router, state]);

  const editFormId = `studio-artifact-edit-${artifact.id}`;

  return (
    <>
      <form id={editFormId} action={formAction} className="space-y-4">
        <input type="hidden" name="episode_id" value={episodeId} />
        <input type="hidden" name="artifact_id" value={artifact.id} />
        {state?.error ? (
          <p className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
            {translateActionErrorMessage(state.error, tAction)}
          </p>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary">
              {t("artifactRoleLabel")}
            </label>
            <input
              name="artifact_role"
              required
              list={STUDIO_ARTIFACT_ROLE_DATALIST_ID}
              autoComplete="off"
              defaultValue={artifact.artifact_role}
              className="h-10 w-full rounded-lg border border-border-subtle bg-field px-3 text-sm text-text-primary focus:border-focus focus:outline-none focus:ring-2 focus:ring-focus/25 dark:border-white/10"
            />
            <p className="mt-1 text-xs text-text-tertiary leading-snug">
              {t("artifactRoleHint")}
            </p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary">
              {t("artifactPlatformLabel")}
            </label>
            <input
              name="tool_platform"
              required
              defaultValue={artifact.tool_platform}
              className="h-10 w-full rounded-lg border border-border-subtle bg-field px-3 text-sm text-text-primary focus:border-focus focus:outline-none focus:ring-2 focus:ring-focus/25 dark:border-white/10"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">
            {t("artifactSortLabel")}
          </label>
          <input
            name="sort_order"
            type="number"
            min={0}
            max={1_000_000}
            step={1}
            defaultValue={artifact.sort_order}
            className="h-10 w-full max-w-[12rem] rounded-lg border border-border-subtle bg-field px-3 text-sm text-text-primary focus:border-focus focus:outline-none focus:ring-2 focus:ring-focus/25 dark:border-white/10"
          />
          <p className="mt-1.5 text-xs text-text-tertiary">{t("artifactSortHint")}</p>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">
            {t("artifactContentLabel")}
          </label>
          <textarea
            name="content_text"
            rows={10}
            defaultValue={artifact.content_text}
            className="min-h-[200px] w-full rounded-lg border border-border-subtle bg-field px-3 py-2.5 text-sm leading-relaxed text-text-primary focus:border-focus focus:outline-none focus:ring-2 focus:ring-focus/25 dark:border-white/10"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">
            {t("artifactExternalUrlLabel")}
          </label>
          <input
            name="external_url"
            type="url"
            inputMode="url"
            defaultValue={artifact.external_url ?? ""}
            placeholder="https://"
            className="h-10 w-full rounded-lg border border-border-subtle bg-field px-3 text-sm text-text-primary focus:border-focus focus:outline-none focus:ring-2 focus:ring-focus/25 dark:border-white/10"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">
            {t("artifactMetadataLabel")}
          </label>
          <textarea
            name="metadata_json"
            rows={6}
            defaultValue={metadataToFormString(artifact.metadata)}
            className="min-h-[140px] w-full rounded-lg border border-border-subtle bg-field px-3 py-2.5 font-mono text-xs leading-relaxed text-text-primary focus:border-focus focus:outline-none focus:ring-2 focus:ring-focus/25 dark:border-white/10"
          />
          <p className="mt-1.5 text-xs text-text-tertiary">{t("artifactMetadataHint")}</p>
        </div>
      </form>
      <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-border-subtle pt-4 dark:border-white/10">
        <Button variant="secondary" type="button" size="sm" onClick={onCancel}>
          {t("artifactDialogCancel")}
        </Button>
        <Button
          variant="primary"
          type="submit"
          form={editFormId}
          size="sm"
          isLoading={pending}
        >
          {t("artifactSave")}
        </Button>
      </div>
    </>
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
  const [editing, setEditing] = useState<StudioProductionArtifactRow | null>(
    null,
  );
  const dialogRef = useRef<HTMLDialogElement>(null);

  const closeArtifactDialog = useCallback(() => {
    dialogRef.current?.close();
  }, []);

  useEffect(() => {
    if (editing) {
      queueMicrotask(() => dialogRef.current?.showModal());
    }
  }, [editing]);

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
      <ArtifactRoleDatalist />
      <ArtifactAddForm episodeId={episodeId} prefill={artifactAddPrefill} />
      {artifacts.length > 0 ? (
        <ul
          className="list-none rounded-xl border border-border-subtle bg-layer-02/30 p-0 m-0 divide-y divide-border-subtle dark:border-white/10 dark:bg-white/2"
          aria-label={t("artifactsHeading")}
        >
          {artifacts.map((a, idx) => (
            <li key={a.id}>
              <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:gap-5 sm:py-5">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-layer-02/90 text-xs font-bold tabular-nums text-text-secondary dark:border-white/10 dark:bg-white/5"
                  aria-label={t("artifactStepBadge", { step: idx + 1 })}
                >
                  {idx + 1}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    <span className="inline-flex max-w-full items-center truncate rounded-md bg-primary/12 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-primary dark:bg-primary/20">
                      {a.artifact_role}
                    </span>
                    <span className="inline-flex max-w-full items-center truncate rounded-md bg-layer-02/90 px-2 py-0.5 text-xs text-text-secondary dark:bg-white/5">
                      {a.tool_platform}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-text-secondary line-clamp-3 whitespace-pre-wrap">
                    {a.content_text.trim()
                      ? excerptArtifactText(a.content_text, 280)
                      : t("artifactPreviewEmpty")}
                  </p>
                  {a.external_url ? (
                    <p className="text-xs">
                      <a
                        href={a.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex max-w-full items-center gap-1.5 text-primary hover:underline"
                      >
                        <ExternalLink
                          className="h-3.5 w-3.5 shrink-0"
                          aria-hidden
                        />
                        <span className="min-w-0 truncate">
                          {artifactLinkHostLabel(a.external_url)}
                        </span>
                      </a>
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-stretch">
                  <Button
                    variant="secondary"
                    type="button"
                    size="sm"
                    className="sm:min-w-28"
                    onClick={() => setEditing(a)}
                  >
                    {t("artifactEdit")}
                  </Button>
                  <ArtifactDeleteForm episodeId={episodeId} artifactId={a.id} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <dialog
        ref={dialogRef}
        className="fixed left-1/2 top-1/2 z-[200] m-0 max-h-[min(90vh,52rem)] w-[min(100vw-1.5rem,42rem)] max-w-[calc(100vw-1.5rem)] -translate-x-1/2 -translate-y-1/2 border-0 bg-transparent p-0 backdrop:bg-black/45 dark:backdrop:bg-black/60"
        aria-labelledby="artifact-edit-dialog-title"
        onClose={() => setEditing(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            closeArtifactDialog();
          }
        }}
      >
        <div
          className="max-h-[min(90vh-2rem,52rem)] overflow-y-auto rounded-xl border border-border-subtle bg-layer-01 p-5 shadow-xl dark:border-white/12 dark:bg-[#0d141c]"
          onClick={(e) => e.stopPropagation()}
        >
          <h3
            id="artifact-edit-dialog-title"
            className="text-base font-semibold text-text-primary mb-4 pr-8"
          >
            {t("artifactEditTitle")}
          </h3>
          {editing ? (
            <ArtifactEditDialogBody
              key={editing.id}
              episodeId={episodeId}
              artifact={editing}
              onSaved={closeArtifactDialog}
              onCancel={closeArtifactDialog}
            />
          ) : null}
        </div>
      </dialog>
    </section>
  );
}
