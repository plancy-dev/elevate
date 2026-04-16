"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import type { EpisodeFormat } from "@/lib/studio-productions/episode-format";

type PipelineStepActionState = {
  ok?: boolean;
  error?: string;
  errorDetail?: string;
} | null;

type YoutubeUploadPipelineStepProps = {
  episodeId: string;
  episodeTitle: string;
  youtubeTitleDefault: string;
  youtubeDescriptionDefault: string;
  thumbnailUrl: string | null;
  hasAssembledVideo: boolean;
  hasYoutubePublish: boolean;
  /** Published video URL after upload (read-only preview). */
  publishUrl?: string | null;
  /** OAuth-connected channel title (actual upload target). */
  youtubeChannelTitle: string | null;
  episodeFormat: EpisodeFormat;
  /** Optional: episode-linked distribution channel (planning); may differ from OAuth target. */
  distributionChannelLabel: string | null;
  step: number;
  ytState: PipelineStepActionState;
  formAction: (payload: FormData) => void;
  pending: boolean;
};

export function YoutubeUploadPipelineStep({
  episodeId,
  episodeTitle,
  youtubeTitleDefault,
  youtubeDescriptionDefault,
  thumbnailUrl,
  hasAssembledVideo,
  hasYoutubePublish,
  publishUrl = null,
  youtubeChannelTitle,
  episodeFormat,
  distributionChannelLabel,
  step,
  ytState,
  formAction,
  pending,
}: YoutubeUploadPipelineStepProps) {
  const t = useTranslations("Dashboard.productions");
  const [open, setOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"preview" | "upload">("upload");
  const [cardAdvOpen, setCardAdvOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [privacy, setPrivacy] = useState("private");

  const oauthConnected = Boolean(youtubeChannelTitle?.trim());

  function syncFormFromDefaults() {
    setTitle(youtubeTitleDefault.trim() || episodeTitle || "");
    setDescription(youtubeDescriptionDefault);
    setTags("");
    setPrivacy("private");
  }

  function openModal(mode: "preview" | "upload") {
    syncFormFromDefaults();
    setModalMode(mode);
    setOpen(true);
  }

  useEffect(() => {
    if (!ytState?.ok) return;
    queueMicrotask(() => {
      setOpen(false);
    });
  }, [ytState]);

  const disabled = !hasAssembledVideo;
  const formatLabel =
    episodeFormat === "shorts"
      ? t("pipelineYoutubeFormatShorts")
      : t("pipelineYoutubeFormatLongform");

  const summaryBlock = (
    <div className="rounded-lg border border-border-subtle bg-layer-02/40 px-3 py-2 text-[11px] text-text-secondary leading-relaxed">
      <p>
        <span className="font-medium text-text-primary">{t("pipelineYoutubeFormatBadge")}:</span>{" "}
        {formatLabel}
      </p>
      <p className="mt-1.5">
        <span className="font-medium text-text-primary">
          {t("pipelineYoutubeUploadTarget")}:
        </span>{" "}
        {oauthConnected ? (
          <span className="text-text-primary">{youtubeChannelTitle}</span>
        ) : (
          <span className="text-amber-600 dark:text-amber-400">
            {t("pipelineYoutubeNotConnectedShort")}
          </span>
        )}
      </p>
      {distributionChannelLabel?.trim() ? (
        <p className="mt-1.5 text-text-tertiary">
          {t("pipelineYoutubeDistributionHint")}{" "}
          <span className="text-text-secondary">{distributionChannelLabel.trim()}</span>
        </p>
      ) : null}
      <p className="mt-2 text-[10px] text-text-tertiary">{t("pipelineYoutubeOAuthExplain")}</p>
    </div>
  );

  return (
    <>
      <div
        className={cn(
          "rounded-lg border px-3 py-3",
          hasYoutubePublish
            ? "border-green-500/30 bg-green-500/5"
            : disabled
              ? "border-border-subtle/50 bg-layer-02/20 opacity-60"
              : "border-border-subtle bg-layer-02/40",
          "sm:col-span-2",
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                hasYoutubePublish
                  ? "bg-green-500/20 text-green-600 dark:text-green-400"
                  : "bg-layer-03 text-text-tertiary",
              )}
            >
              {hasYoutubePublish ? "\u2713" : step}
            </span>
            <span className="text-xs font-medium text-text-primary truncate">
              {t("draftYoutubeCta")}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            {!disabled ? (
              <button
                type="button"
                className="text-[10px] text-text-tertiary hover:text-text-secondary px-1"
                onClick={() => setCardAdvOpen((p) => !p)}
                aria-expanded={cardAdvOpen}
              >
                {cardAdvOpen ? "\u25B2" : "\u2699"}
              </button>
            ) : null}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={disabled}
              onClick={() => openModal("preview")}
            >
              {t("pipelineYoutubeButtonView")}
            </Button>
            <Button
              type="button"
              variant={hasYoutubePublish ? "secondary" : "ghost"}
              size="sm"
              disabled={disabled}
              onClick={() => openModal("upload")}
            >
              {hasYoutubePublish ? t("pipelineYoutubeButtonReupload") : t("pipelineYoutubeButtonUpload")}
            </Button>
          </div>
        </div>
        {cardAdvOpen && !disabled ? (
          <p className="mt-2 text-[10px] text-text-tertiary leading-relaxed pl-7 border-t border-border-subtle/50 pt-2">
            {t("pipelineYoutubeCardAdvancedHint")}
          </p>
        ) : null}
        {disabled && !hasYoutubePublish ? (
          <p className="mt-1.5 text-[10px] text-text-tertiary leading-relaxed pl-7">
            {t("draftYoutubeDisabledHint")}
          </p>
        ) : null}
        {!disabled && !oauthConnected ? (
          <p className="mt-1.5 text-[10px] text-text-tertiary leading-relaxed pl-7">
            {t("pipelineYoutubeNotConnected")}{" "}
            <Link
              href="/dashboard/productions?studio=integrations"
              className="font-medium text-primary hover:underline"
            >
              {t("draftRunwayIntegrationsLink")}
            </Link>
          </p>
        ) : null}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t("pipelineYoutubePreviewTitle")}
        description={
          modalMode === "preview"
            ? t("pipelineYoutubePreviewReadOnlyHint")
            : t("pipelineYoutubePreviewSubtitle")
        }
        size="xl"
      >
        <div className="space-y-5 text-sm">
          {summaryBlock}

          {thumbnailUrl ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-text-tertiary mb-1.5">
                {t("pipelineYoutubeThumbnailLabel")}
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element -- data URL or remote preview */}
              <img
                src={thumbnailUrl}
                alt=""
                className="max-h-40 w-full max-w-md rounded-lg border border-border-subtle object-contain bg-black/5"
              />
            </div>
          ) : (
            <p className="text-xs text-text-tertiary">{t("pipelineYoutubeNoThumbnail")}</p>
          )}

          {hasYoutubePublish && publishUrl?.trim() ? (
            <p className="text-sm">
              <a
                href={publishUrl.trim()}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline"
              >
                {t("pipelineYoutubePublishedLink")}
              </a>
            </p>
          ) : null}

          {modalMode === "preview" ? (
            <div className="space-y-3 rounded-lg border border-border-subtle/80 bg-layer-02/25 px-3 py-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
                  {t("pipelineYoutubeTitleLabel")}
                </p>
                <p className="mt-1 text-text-primary whitespace-pre-wrap">{title || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
                  {t("pipelineYoutubeDescriptionLabel")}
                </p>
                <p className="mt-1 text-text-secondary whitespace-pre-wrap leading-relaxed">
                  {description || "—"}
                </p>
              </div>
            </div>
          ) : null}

          {modalMode === "upload" ? (
            <form action={formAction} className="space-y-3">
              <input type="hidden" name="episode_id" value={episodeId} />

              <div>
                <label className="block text-[10px] font-medium text-text-tertiary mb-0.5" htmlFor="yt-upload-title">
                  {t("pipelineYoutubeTitleLabel")}
                </label>
                <input
                  id="yt-upload-title"
                  name="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                  className="w-full rounded border border-border-subtle bg-field px-2 py-1.5 text-sm text-text-primary"
                  required
                />
              </div>

              <div>
                <label
                  className="block text-[10px] font-medium text-text-tertiary mb-0.5"
                  htmlFor="yt-upload-desc"
                >
                  {t("pipelineYoutubeDescriptionLabel")}
                </label>
                <textarea
                  id="yt-upload-desc"
                  name="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  className="w-full rounded border border-border-subtle bg-field px-2 py-1.5 text-sm text-text-primary"
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-text-tertiary mb-0.5" htmlFor="yt-tags">
                  {t("pipelineYoutubeTagsLabel")}
                </label>
                <input
                  id="yt-tags"
                  name="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder={t("pipelineYoutubeTagsPlaceholder")}
                  className="w-full rounded border border-border-subtle bg-field px-2 py-1.5 text-sm text-text-primary placeholder:text-text-tertiary"
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-text-tertiary mb-0.5" htmlFor="yt-privacy">
                  {t("pipelineYoutubePrivacyLabel")}
                </label>
                <select
                  id="yt-privacy"
                  name="privacy"
                  value={privacy}
                  onChange={(e) => setPrivacy(e.target.value)}
                  className="w-full max-w-xs rounded border border-border-subtle bg-field px-2 py-1.5 text-sm text-text-primary"
                >
                  <option value="private">{t("pipelineYoutubePrivacyPrivate")}</option>
                  <option value="unlisted">{t("pipelineYoutubePrivacyUnlisted")}</option>
                  <option value="public">{t("pipelineYoutubePrivacyPublic")}</option>
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button
                  type="submit"
                  disabled={!oauthConnected || disabled}
                  isLoading={pending}
                >
                  {t("pipelineYoutubeSubmit")}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                  {t("pipelineYoutubeClose")}
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex flex-wrap gap-2 pt-1">
              <Button type="button" onClick={() => setModalMode("upload")}>
                {t("pipelineYoutubeSwitchToUpload")}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                {t("pipelineYoutubeClose")}
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
